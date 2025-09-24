import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { IStorageProvider } from './storage.interface';
import { S3Provider } from './providers/s3.provider';
import { MinioProvider } from './providers/minio.provider';

@Injectable()
export class StorageService {
  private readonly provider: IStorageProvider;

  constructor() {
    const fileStorageProvider = process.env.FILE_STORAGE_PROVIDER;
    switch (fileStorageProvider) {
      case 'minio':
        this.provider = new MinioProvider();
        break;
      case 's3':
      default:
        this.provider = new S3Provider();
        break;
    }
  }

  async uploadFileToBucket(
    fileBuffer: Buffer,
    ext: string,
    filename: string,
    bucketName: string,
    encoding: string,
    filePath = ''
  ): Promise<string> {
    const timestamp = Date.now();
    const key = `${filePath}/${encodeURIComponent(filename)}-${timestamp}.${ext}`;
    try {
      return await this.provider.uploadFile(bucketName, key, fileBuffer, {
        encoding,
        mimeType: 'image/png'
      });
    } catch (error) {
      throw new HttpException(error, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async uploadCsvFile(key: string, body: unknown): Promise<void> {
    try {
      await this.provider.uploadFile(process.env.FILE_BUCKET as string, key, Buffer.from(String(body)), {
        mimeType: 'text/csv'
      });
    } catch (error) {
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async getFile(key: string): Promise<Buffer> {
    try {
      return await this.provider.getFile(process.env.FILE_BUCKET as string, key);
    } catch (error) {
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.provider.deleteFile(process.env.FILE_BUCKET as string, key);
    } catch (error) {
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async storeObject(persistent: boolean, key: string, body: unknown): Promise<string> {
    try {
      return await this.provider.storeObject(process.env.STORE_OBJECT_BUCKET as string, persistent, key, body);
    } catch (error) {
      throw new RpcException(error.response ? error.response : error);
    }
  }
}
