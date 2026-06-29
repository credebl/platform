import { S3 } from 'aws-sdk';

export interface IStorageService {
  uploadFileToS3Bucket(
    fileBuffer: Buffer,
    ext: string,
    filename: string,
    bucketName: string,
    encoding: string,
    pathAWS?: string
  ): Promise<string>;

  uploadCsvFile(key: string, body: unknown): Promise<void>;

  getFile(key: string): Promise<S3.GetObjectOutput>;

  deleteFile(key: string): Promise<void>;

  storeObject(persistent: boolean, key: string, body: unknown): Promise<S3.ManagedUpload.SendData>;
}
