import * as path from 'path';

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { IStorageService } from '../storage.interface';
import { S3 } from 'aws-sdk';
import { promises as fs } from 'fs';

@Injectable()
export class LocalFsStorageService implements IStorageService {
  private localStoragePath: string;

  constructor() {
    this.localStoragePath = path.resolve(process.cwd(), 'uploadedFiles');
  }

  private async ensureDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  private resolveUnderBase(baseDir: string, relativePath: string): string {
    const resolvedBase = path.resolve(baseDir);
    const resolvedTarget = path.resolve(baseDir, relativePath);
    if (!resolvedTarget.startsWith(`${resolvedBase}${path.sep}`) && resolvedTarget !== resolvedBase) {
      throw new HttpException('Invalid file key/path', HttpStatus.BAD_REQUEST);
    }
    return resolvedTarget;
  }

  async uploadFileToS3Bucket(
    fileBuffer: Buffer,
    ext: string,
    filename: string,
    bucketName: string,
    encoding: string,
    pathAWS: string = ''
  ): Promise<string> {
    const bucketDir = path.join(this.localStoragePath, bucketName);
    await this.ensureDir(path.join(bucketDir, pathAWS));
    const timestamp = Date.now();
    const fileKey = `${pathAWS}/${encodeURIComponent(filename)}-${timestamp}.${ext}`;
    const filePath = this.resolveUnderBase(bucketDir, fileKey);
    await fs.writeFile(filePath, fileBuffer);
    return `${process.env.PLATFORM_URL}/uploadedFiles/${bucketName}/${fileKey}`;
  }

  async uploadCsvFile(key: string, body: unknown): Promise<void> {
    const bucketDir = path.join(this.localStoragePath, process.env.FILE_SHARING_BUCKET);
    const filePath = path.join(bucketDir, key);
    await this.ensureDir(path.dirname(filePath));
    const data = 'string' === typeof body ? body : body.toString();
    await fs.writeFile(filePath, data);
  }

  async getFile(key: string): Promise<AWS.S3.GetObjectOutput> {
    const filePath = path.join(this.localStoragePath, process.env.FILE_SHARING_BUCKET, key);
    const fileContent = await fs.readFile(filePath);
    return { Body: fileContent } as AWS.S3.GetObjectOutput;
  }

  async deleteFile(key: string): Promise<void> {
    const filePath = path.join(this.localStoragePath, process.env.FILE_SHARING_BUCKET, key);
    await fs.unlink(filePath);
  }

  async storeObject(persistent: boolean, key: string, body: unknown): Promise<S3.ManagedUpload.SendData> {
    const objKey = persistent ? `persist/${key}` : `default/${key}`;
    const objFilePath = `${objKey}.json`;
    const bucketDir = path.join(this.localStoragePath, process.env.STOREOBJECT_BUCKET);
    const filePath = path.join(bucketDir, objFilePath);
    const publicUrl = `${process.env.PLATFORM_URL}/uploadedFiles/${process.env.STOREOBJECT_BUCKET}/${objFilePath}`;
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
      Bucket: process.env.STOREOBJECT_BUCKET
    } as S3.ManagedUpload.SendData;
  }
}
