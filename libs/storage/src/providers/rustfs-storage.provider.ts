import { BaseS3StorageService } from './base-s3-storage.provider';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RustFsStorageService extends BaseS3StorageService {
  constructor() {
    const endpoint = process.env.RUSTFS_ENDPOINT || 'http://localhost:9000';

    const baseConfig = {
      accessKeyId: process.env.RUSTFS_ACCESS_KEY_ID,
      secretAccessKey: process.env.RUSTFS_SECRET_ACCESS_KEY,
      endpoint,
      s3ForcePathStyle: true
    };

    const s3Config = { ...baseConfig, region: process.env.AWS_REGION };
    const s4Config = { ...baseConfig, region: process.env.AWS_PUBLIC_REGION };
    const storeObjectConfig = { ...baseConfig, region: process.env.AWS_S3_STOREOBJECT_REGION };

    super(s3Config, s4Config, storeObjectConfig);
  }

  getPublicUrl(bucketName: string, fileKey: string): string {
    const endpoint = process.env.RUSTFS_ENDPOINT || 'http://localhost:9000';
    return `${endpoint}/${bucketName}/${fileKey}`;
  }
}
