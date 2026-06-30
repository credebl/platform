import { Injectable } from '@nestjs/common';

import { CommonConstants } from 'libs/common/src/common.constant';
import { S3 } from 'aws-sdk';
import { fetchOpenBaoSecrets } from 'libs/common/src/utils/openbao.util';
import { BaseS3StorageService } from './base-s3-storage.provider';

@Injectable()
export class S3StorageService extends BaseS3StorageService {
  protected async getS3Client(): Promise<S3> {
    const secrets = await fetchOpenBaoSecrets(CommonConstants.CREDEBL_AWS_KEY_PATH);
    return new S3({
      accessKeyId: secrets.AWS_ACCESS_KEY,
      secretAccessKey: secrets.AWS_SECRET_KEY,
      region: secrets.AWS_REGION
    });
  }

  protected async getPublicS3Client(): Promise<S3> {
    const secrets = await fetchOpenBaoSecrets(CommonConstants.CREDEBL_AWS_KEY_PATH);
    return new S3({
      accessKeyId: secrets.AWS_PUBLIC_ACCESS_KEY,
      secretAccessKey: secrets.AWS_PUBLIC_SECRET_KEY,
      region: secrets.AWS_PUBLIC_REGION
    });
  }

  protected async getStoreObjectS3Client(): Promise<S3> {
    const secrets = await fetchOpenBaoSecrets(CommonConstants.CREDEBL_AWS_KEY_PATH);
    return new S3({
      accessKeyId: secrets.AWS_S3_STOREOBJECT_ACCESS_KEY,
      secretAccessKey: secrets.AWS_S3_STOREOBJECT_SECRET_KEY,
      region: secrets.AWS_S3_STOREOBJECT_REGION
    });
  }

  getPublicUrl(bucketName: string, fileKey: string): string {
    return `https://${bucketName}.s3.${process.env.AWS_PUBLIC_REGION}.amazonaws.com/${fileKey}`;
  }
}
