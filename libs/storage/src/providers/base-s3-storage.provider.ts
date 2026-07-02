import { HttpException, HttpStatus } from '@nestjs/common';

import { Buffer } from 'node:buffer';
import { IStorageService } from '../storage.interface';
import { RpcException } from '@nestjs/microservices';
import { S3 } from 'aws-sdk';
import { promisify } from 'node:util';

function extToMimeType(ext: string): string {
  const mime: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    pdf: 'application/pdf',
    csv: 'text/csv',
    json: 'application/json',
    txt: 'text/plain',
    html: 'text/html',
    xml: 'application/xml',
    zip: 'application/zip',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  return mime[ext.toLowerCase()] ?? 'application/octet-stream';
}

export abstract class BaseS3StorageService implements IStorageService {
  protected abstract getS3Client(): Promise<S3>;
  protected abstract getPublicS3Client(): Promise<S3>;
  protected abstract getStoreObjectS3Client(): Promise<S3>;

  abstract getPublicUrl(bucketName: string, fileKey: string): string;

  async uploadFileToS3Bucket(
    fileBuffer: Buffer,
    ext: string,
    filename: string,
    bucketName: string,
    encoding: string,
    pathAWS: string = ''
  ): Promise<string> {
    const s4 = await this.getPublicS3Client();
    const timestamp = Date.now();
    const putObjectAsync = promisify(s4.putObject).bind(s4);
    const fileKey = `${pathAWS}/${encodeURIComponent(filename)}-${timestamp}.${ext}`;
    try {
      await putObjectAsync({
        Bucket: `${bucketName}`,
        Key: `${pathAWS}/${encodeURIComponent(filename)}-${timestamp}.${ext}`,
        Body: fileBuffer,
        ContentEncoding: encoding,
        ContentType: extToMimeType(ext)
      });
      return this.getPublicUrl(bucketName, fileKey);
    } catch (error) {
      throw new HttpException(error, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async uploadCsvFile(key: string, body: unknown): Promise<void> {
    const s3 = await this.getS3Client();
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
      await s3.upload(params).promise();
    } catch (error) {
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async getFile(key: string): Promise<AWS.S3.GetObjectOutput> {
    const s3 = await this.getS3Client();
    const params: AWS.S3.GetObjectRequest = {
      Bucket: process.env.FILE_SHARING_BUCKET,
      Key: key
    };
    try {
      return s3.getObject(params).promise();
    } catch (error) {
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async deleteFile(key: string): Promise<void> {
    const s3 = await this.getS3Client();
    const params: AWS.S3.DeleteObjectRequest = {
      Bucket: process.env.FILE_SHARING_BUCKET,
      Key: key
    };
    try {
      await s3.deleteObject(params).promise();
    } catch (error) {
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async storeObject(persistent: boolean, key: string, body: unknown): Promise<S3.ManagedUpload.SendData> {
    const s3StoreObject = await this.getStoreObjectS3Client();
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
      return await s3StoreObject.upload(params).promise();
    } catch (error) {
      throw new RpcException(error.response ? error.response : error);
    }
  }
}
