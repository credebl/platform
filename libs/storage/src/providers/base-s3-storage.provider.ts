import { HttpException, HttpStatus } from '@nestjs/common';

import { Buffer } from 'node:buffer';
import { IStorageService } from '../storage.interface';
import { RpcException } from '@nestjs/microservices';
import { S3 } from 'aws-sdk';
import { promisify } from 'node:util';

export abstract class BaseS3StorageService implements IStorageService {
  protected s3: S3;
  protected s4: S3;
  protected s3StoreObject: S3;

  constructor(
    s3Config: Record<string, unknown>,
    s4Config: Record<string, unknown>,
    storeObjectConfig: Record<string, unknown>
  ) {
    this.s3 = new S3(s3Config);
    this.s4 = new S3(s4Config);
    this.s3StoreObject = new S3(storeObjectConfig);
  }

  abstract getPublicUrl(bucketName: string, fileKey: string): string;

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
    try {
      await putObjectAsync({
        Bucket: `${bucketName}`,
        Key: `${pathAWS}/${encodeURIComponent(filename)}-${timestamp}.${ext}`,
        Body: fileBuffer,
        ContentEncoding: encoding,
        ContentType: `image/png`
      });
      return this.getPublicUrl(bucketName, fileKey);
    } catch (error) {
      throw new HttpException(error, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async uploadCsvFile(key: string, body: unknown): Promise<void> {
    let data: string;
    if ('string' === typeof body) {
      data = body;
    } else if (Buffer.isBuffer(body)) {
      data = (body as Buffer).toString('utf-8');
    } else {
      data = JSON.stringify(body);
    }

    const params: AWS.S3.PutObjectRequest = {
      Bucket: process.env.FILE_SHARING_BUCKET,
      Key: key,
      Body: data
    };
    try {
      await this.s3.upload(params).promise();
    } catch (error) {
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async getFile(key: string): Promise<AWS.S3.GetObjectOutput> {
    const params: AWS.S3.GetObjectRequest = {
      Bucket: process.env.FILE_SHARING_BUCKET,
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
      Bucket: process.env.FILE_SHARING_BUCKET,
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
      Bucket: process.env.STOREOBJECT_BUCKET,
      Body: buf,
      Key: objKey,
      ContentEncoding: 'base64',
      ContentType: 'application/json'
    };

    try {
      return await this.s3StoreObject.upload(params).promise();
    } catch (error) {
      throw new RpcException(error.response ? error.response : error);
    }
  }
}
