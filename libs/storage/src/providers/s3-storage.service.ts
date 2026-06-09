import { Injectable } from '@nestjs/common';
import { BaseS3StorageService } from './base-s3-storage.service';

@Injectable()
export class S3StorageService extends BaseS3StorageService {
  constructor() {
    const s3Config = {
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
      region: process.env.AWS_REGION
    };

    const s4Config = {
      accessKeyId: process.env.AWS_PUBLIC_ACCESS_KEY,
      secretAccessKey: process.env.AWS_PUBLIC_SECRET_KEY,
      region: process.env.AWS_PUBLIC_REGION
    };

    const storeObjectConfig = {
      accessKeyId: process.env.AWS_S3_STOREOBJECT_ACCESS_KEY,
      secretAccessKey: process.env.AWS_S3_STOREOBJECT_SECRET_KEY,
      region: process.env.AWS_S3_STOREOBJECT_REGION
    };

    super(s3Config, s4Config, storeObjectConfig);
  }

  getPublicUrl(bucketName: string, fileKey: string): string {
    return `https://${bucketName}.s3.${process.env.AWS_PUBLIC_REGION}.amazonaws.com/${fileKey}`;
  }
}
