import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { IStorageService } from './storage.interface';
import { S3StorageService } from './providers/s3-storage.service';
import { RustFsStorageService } from './providers/rustfs-storage.service';
import { LocalFsStorageService } from './providers/local-fs-storage.service';

@Injectable()
export class StorageService implements IStorageService {
  private storage: IStorageService;

  constructor() {
    const storageType = process.env.STORAGE_TYPE || 'aws';
    switch (storageType) {
      case 'local':
        this.storage = new LocalFsStorageService();
        break;
      case 'rustfs':
        this.storage = new RustFsStorageService();
        break;
      default:
        this.storage = new S3StorageService();
        break;
    }
  }

  async uploadFileToS3Bucket(
    fileBuffer: Buffer,
    ext: string,
    filename: string,
    bucketName: string,
    encoding: string,
    pathAWS?: string
  ): Promise<string> {
    return this.storage.uploadFileToS3Bucket(fileBuffer, ext, filename, bucketName, encoding, pathAWS);
  }

  async uploadCsvFile(key: string, body: unknown): Promise<void> {
    return this.storage.uploadCsvFile(key, body);
  }

  async getFile(key: string): Promise<S3.GetObjectOutput> {
    return this.storage.getFile(key);
  }

  async deleteFile(key: string): Promise<void> {
    return this.storage.deleteFile(key);
  }

  async storeObject(persistent: boolean, key: string, body: unknown): Promise<S3.ManagedUpload.SendData> {
    return this.storage.storeObject(persistent, key, body);
  }
}
