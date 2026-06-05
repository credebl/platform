import * as path from 'path';

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { RpcException } from '@nestjs/microservices';
import { S3 } from 'aws-sdk';
import { promises as fs } from 'fs';
import { promisify } from 'util';

@Injectable()
export class AwsService {
  private s3: S3;
  private s4: S3;
  private s3StoreObject: S3;
  private isLocal: boolean;
  private isLocalFs: boolean;
  private localStoragePath: string;

  constructor() {
    this.isLocalFs = 'true' === process.env.IS_LOCAL_FS;
    this.isLocal = 'true' === process.env.IS_LOCAL_RUSTFS;
    this.localStoragePath = path.resolve(process.cwd(), 'uploadedFiles');

    if (this.isLocalFs) {
      return;
    }

    const accessKey = this.isLocal ? process.env.RUSTFS_ACCESS_KEY_ID : process.env.AWS_ACCESS_KEY;
    const secretKey = this.isLocal ? process.env.RUSTFS_SECRET_ACCESS_KEY : process.env.AWS_SECRET_KEY;

    const publicAccessKey = this.isLocal ? process.env.RUSTFS_ACCESS_KEY_ID : process.env.AWS_PUBLIC_ACCESS_KEY;
    const publicSecretKey = this.isLocal ? process.env.RUSTFS_SECRET_ACCESS_KEY : process.env.AWS_PUBLIC_SECRET_KEY;

    const storeAccessKey = this.isLocal ? process.env.RUSTFS_ACCESS_KEY_ID : process.env.AWS_S3_STOREOBJECT_ACCESS_KEY;
    const storeSecretKey = this.isLocal
      ? process.env.RUSTFS_SECRET_ACCESS_KEY
      : process.env.AWS_S3_STOREOBJECT_SECRET_KEY;

    // Base config shared across environments
    const localOverrides = this.isLocal
      ? {
          endpoint: process.env.RUSTFS_ENDPOINT || 'http://localhost:9000',
          s3ForcePathStyle: true
        }
      : {};
    this.s3 = new S3({
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
      region: process.env.AWS_REGION,
      ...localOverrides
    });

    this.s4 = new S3({
      accessKeyId: publicAccessKey,
      secretAccessKey: publicSecretKey,
      region: process.env.AWS_PUBLIC_REGION,
      ...localOverrides
    });

    this.s3StoreObject = new S3({
      accessKeyId: storeAccessKey,
      secretAccessKey: storeSecretKey,
      region: process.env.AWS_S3_STOREOBJECT_REGION,
      ...localOverrides
    });
  }

  private async ensureDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  async uploadFileToS3Bucket(
    fileBuffer: Buffer,
    ext: string,
    filename: string,
    bucketName: string,
    encoding: string,
    pathAWS: string = ''
  ): Promise<string> {
    if (this.isLocalFs) {
      const bucketDir = path.join(this.localStoragePath, bucketName);
      await this.ensureDir(path.join(bucketDir, pathAWS));
      const timestamp = Date.now();
      const fileKey = `${pathAWS}/${encodeURIComponent(filename)}-${timestamp}.${ext}`;
      const filePath = path.join(bucketDir, fileKey);
      await fs.writeFile(filePath, fileBuffer);
      return `${process.env.PLATFORM_URL}/uploadedFiles/${bucketName}/${fileKey}`;
    }

    const timestamp = Date.now();
    const putObjectAsync = promisify(this.s4.putObject).bind(this.s4);
    const fileKey = `${pathAWS}/${encodeURIComponent(filename)}-${timestamp}.${ext}`;
    try {
      await putObjectAsync({
        Bucket: `${bucketName}`,
        Key: `${pathAWS}/${encodeURIComponent(filename)}-${timestamp}.${ext}`,
        Body: fileBuffer,
        ContentEncoding: encoding,
        ContentType: `image/png`
      });
      let imageUrl: string;
      if (this.isLocal) {
        imageUrl = `${process.env.RUSTFS_ENDPOINT || 'http://localhost:9000'}/${bucketName}/${fileKey}`;
      } else {
        imageUrl = `https://${bucketName}.s3.${process.env.AWS_PUBLIC_REGION}.amazonaws.com/${fileKey}`;
      }
      // const imageUrl = `https://${bucketName}.s3.${process.env.AWS_PUBLIC_REGION}.amazonaws.com/${pathAWS}/${encodeURIComponent(filename)}-${timestamp}.${ext}`;
      return imageUrl;
    } catch (error) {
      throw new HttpException(error, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async uploadCsvFile(key: string, body: unknown): Promise<void> {
    if (this.isLocalFs) {
      const bucketDir = path.join(this.localStoragePath, process.env.AWS_BUCKET);
      await this.ensureDir(bucketDir);
      const filePath = path.join(bucketDir, key);
      const data = 'string' === typeof body ? body : body.toString();
      await fs.writeFile(filePath, data);
      return;
    }

    const params: AWS.S3.PutObjectRequest = {
      Bucket: process.env.AWS_BUCKET,
      Key: key,
      Body: 'string' === typeof body ? body : body.toString()
    };
    try {
      await this.s3.upload(params).promise();
    } catch (error) {
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async getFile(key: string): Promise<AWS.S3.GetObjectOutput> {
    if (this.isLocalFs) {
      const filePath = path.join(this.localStoragePath, process.env.AWS_BUCKET, key);
      const fileContent = await fs.readFile(filePath);
      return { Body: fileContent } as AWS.S3.GetObjectOutput;
    }

    const params: AWS.S3.GetObjectRequest = {
      Bucket: process.env.AWS_BUCKET,
      Key: key
    };
    try {
      return this.s3.getObject(params).promise();
    } catch (error) {
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async deleteFile(key: string): Promise<void> {
    if (this.isLocalFs) {
      const filePath = path.join(this.localStoragePath, process.env.AWS_BUCKET, key);
      await fs.unlink(filePath);
      return;
    }

    const params: AWS.S3.DeleteObjectRequest = {
      Bucket: process.env.AWS_BUCKET,
      Key: key
    };
    try {
      await this.s3.deleteObject(params).promise();
    } catch (error) {
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async storeObject(persistent: boolean, key: string, body: unknown): Promise<S3.ManagedUpload.SendData> {
    if (this.isLocalFs) {
      const objKey = persistent ? `persist/${key}` : `default/${key}`;
      const objFilePath = `${objKey}.json`;
      const bucketDir = path.join(this.localStoragePath, process.env.AWS_S3_STOREOBJECT_BUCKET);
      const filePath = path.join(bucketDir, objFilePath);
      const publicUrl = `${process.env.PLATFORM_URL}/uploadedFiles/${process.env.AWS_S3_STOREOBJECT_BUCKET}/${objFilePath}`;
      await this.ensureDir(path.dirname(filePath));
      const buf = Buffer.from(JSON.stringify(body));
      await fs.writeFile(filePath, buf);
      return {
        Expiration: 'expiry-date="Sun, 05 Jul 2026 00:00:00 GMT", rule-id="Default_folder"',
        ETag: '',
        ServerSideEncryption: '',
        Location: publicUrl,
        key: objFilePath,
        Key: objFilePath,
        Bucket: process.env.AWS_S3_STOREOBJECT_BUCKET
      } as S3.ManagedUpload.SendData;
    }

    const objKey: string = persistent.valueOf() ? `persist/${key}` : `default/${key}`;
    const buf = Buffer.from(JSON.stringify(body));
    const params: AWS.S3.PutObjectRequest = {
      Bucket: process.env.AWS_S3_STOREOBJECT_BUCKET,
      Body: buf,
      Key: objKey,
      ContentEncoding: 'base64',
      ContentType: 'application/json'
    };

    try {
      const receivedData = await this.s3StoreObject.upload(params).promise();
      return receivedData;
    } catch (error) {
      throw new RpcException(error.response ? error.response : error);
    }
  }
}
