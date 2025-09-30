import { Client } from 'minio';
import { FileUploadOptions, IStorageProvider } from '../storage.interface';
import { CommonConstants } from '@credebl/common/common.constant';

export class MinioProvider implements IStorageProvider {
  private readonly minioClient: Client;

  constructor() {
    const requiredEnvVars = ['MINIO_ENDPOINT', 'MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY', 'MINIO_PORT'];
    const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
    if (0 < missingVars.length) {
      throw new Error(`Missing required Minio environment variables: ${missingVars.join(', ')}`);
    }
    this.minioClient = new Client({
      endPoint: process.env.MINIO_ENDPOINT as string,
      port: parseInt(process.env.MINIO_PORT || '9000', 10),
      useSSL: 'true' === process.env.MINIO_USE_SSL,
      accessKey: process.env.MINIO_ACCESS_KEY as string,
      secretKey: process.env.MINIO_SECRET_KEY as string
    });
  }

  async uploadFile(bucket: string, key: string, content: Buffer, options: FileUploadOptions): Promise<string> {
    await this.minioClient.putObject(bucket, key, content, null, {
      'Content-Type': options.mimeType,
      'Content-Encoding': options.encoding
    });
    const protocol = 'true' === process.env.MINIO_USE_SSL ? 'https' : 'http';
    return `${protocol}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucket}/${key}`;
  }

  async getFile(bucket: string, key: string): Promise<Buffer> {
    const stream = await this.minioClient.getObject(bucket, key);
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  async deleteFile(bucket: string, key: string): Promise<void> {
    await this.minioClient.removeObject(bucket, key);
  }

  async storeObject(bucket: string, persistent: boolean, key: string, body: unknown): Promise<string> {
    const objKey = persistent ? `persist/${key}` : `default/${key}`;
    const buffer = Buffer.from(JSON.stringify(body));

    await this.minioClient.putObject(bucket, objKey, buffer, null, {
      ContentType: 'application/json',
      ContentEncoding: CommonConstants.ENCODING
    });
    const protocol = 'true' === process.env.MINIO_USE_SSL ? 'https' : 'http';
    return `${protocol}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucket}/${objKey}`;
  }
}
