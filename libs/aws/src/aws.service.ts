import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { RpcException } from '@nestjs/microservices';
import { S3 } from 'aws-sdk';
import { promisify } from 'util';

@Injectable()
export class AwsService {
  private s3: S3;
  private s4: S3;
  private s3StoreObject: S3;
  private isLocal: boolean;

  constructor() {
    this.isLocal = 'true' === process.env.IS_LOCAL_RUSTFS;
    const accessKey = this.isLocal ? process.env.RUSTFS_ACCESS_KEY_ID : process.env.AWS_ACCESS_KEY;
    const secretKey = this.isLocal ? process.env.RUSTFS_SECRET_ACCESS_KEY : process.env.AWS_SECRET_KEY;

    const publicAccessKey = this.isLocal ? process.env.RUSTFS_ACCESS_KEY_ID : process.env.AWS_PUBLIC_ACCESS_KEY;
    const publicSecretKey = this.isLocal ? process.env.RUSTFS_SECRET_ACCESS_KEY : process.env.AWS_PUBLIC_SECRET_KEY;

    const storeAccessKey = this.isLocal ? process.env.RUSTFS_ACCESS_KEY_ID : process.env.AWS_S3_STOREOBJECT_ACCESS_KEY;
    const storeSecretKey = this.isLocal
      ? process.env.RUSTFS_SECRET_ACCESS_KEY
      : process.env.AWS_S3_STOREOBJECT_SECRET_KEY;
    // console.log('AWS_ACCESS_KEY : ', accessKey);
    // console.log('AWS_SECRET_KEY : ', secretKey);
    // console.log('AWS_PUBLIC_ACCESS_KEY : ', publicAccessKey);
    // console.log('AWS_PUBLIC_SECRET_KEY : ', publicSecretKey);
    // console.log('AWS_S3_STOREOBJECT_ACCESS_KEY : ', storeAccessKey);
    // console.log('AWS_S3_STOREOBJECT_SECRET_KEY : ', storeSecretKey);
    // Base config shared across environments
    const localOverrides = this.isLocal
      ? {
          endpoint: process.env.AWS_LOCAL_ENDPOINT || 'http://localhost:9000',
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

  async uploadFileToS3Bucket(
    fileBuffer: Buffer,
    ext: string,
    filename: string,
    bucketName: string,
    encoding: string,
    pathAWS: string = ''
  ): Promise<string> {
    const timestamp = Date.now();
    const putObjectAsync = promisify(this.s4.putObject).bind(this.s4);
    const fileKey = `${pathAWS}/${encodeURIComponent(filename)}-${timestamp}.${ext}`;
    // console.log("bucketName : ", bucketName);
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
        imageUrl = `${process.env.AWS_LOCAL_ENDPOINT || 'http://localhost:9000'}/${bucketName}/${fileKey}`;
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
    const params: AWS.S3.PutObjectRequest = {
      Bucket: process.env.AWS_BUCKET,
      Key: key,
      Body: 'string' === typeof body ? body : body.toString()
    };
    // console.log("Uploading CSV with params: ", params);
    try {
      await this.s3.upload(params).promise();
      // console.log("Upload result: ", res);
    } catch (error) {
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async getFile(key: string): Promise<AWS.S3.GetObjectOutput> {
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
