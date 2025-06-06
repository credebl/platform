import { S3 } from 'aws-sdk';
import { FileUploadOptions, IStorageProvider } from '../storage.interface';
import { CommonConstants } from '@credebl/common/common.constant';

export class S3Provider implements IStorageProvider {
  private readonly s3: S3;

  constructor() {
    this.s3 = new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
      region: process.env.AWS_REGION
    });
  }

  async uploadFile(bucket: string, key: string, content: Buffer, options: FileUploadOptions): Promise<string> {
    await this.s3
      .putObject({
        Bucket: bucket,
        Key: key,
        Body: content,
        ContentEncoding: options.encoding,
        ContentType: options.mimeType
      })
      .promise();

    return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  async getFile(bucket: string, key: string): Promise<Buffer> {
    const result = await this.s3.getObject({ Bucket: bucket, Key: key }).promise();
    return result.Body as Buffer;
  }

  async deleteFile(bucket: string, key: string): Promise<void> {
    await this.s3.deleteObject({ Bucket: bucket, Key: key }).promise();
  }

  async storeObject(bucket: string, persistent: boolean, key: string, body: unknown): Promise<string> {
    const objKey = persistent ? `persist/${key}` : `default/${key}`;
    const buffer = Buffer.from(JSON.stringify(body));

    await this.s3
      .putObject({
        Bucket: bucket,
        Key: objKey,
        Body: buffer,
        ContentEncoding: CommonConstants.ENCODING.toString(),
        ContentType: 'application/json'
      })
      .promise();

    return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${objKey}`;
  }
}
