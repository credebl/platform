import { BaseS3StorageService } from './base-s3-storage.provider';
import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';

@Injectable()
export class RustFsStorageService extends BaseS3StorageService {
  private readonly endpoint = process.env.RUSTFS_ENDPOINT || 'http://localhost:9000';
  private readonly baseConfig = {
    accessKeyId: process.env.RUSTFS_ACCESS_KEY_ID,
    secretAccessKey: process.env.RUSTFS_SECRET_ACCESS_KEY,
    endpoint: this.endpoint,
    s3ForcePathStyle: true
  };

  protected async getS3Client(): Promise<S3> {
    return new S3({ ...this.baseConfig, region: process.env.AWS_REGION });
  }

  protected async getPublicS3Client(): Promise<S3> {
    return new S3({ ...this.baseConfig, region: process.env.AWS_PUBLIC_REGION });
  }

  protected async getStoreObjectS3Client(): Promise<S3> {
    return new S3({ ...this.baseConfig, region: process.env.AWS_S3_STOREOBJECT_REGION });
  }

  getPublicUrl(bucketName: string, fileKey: string): string {
    return `${this.endpoint}/${bucketName}/${fileKey}`;
  }
}
