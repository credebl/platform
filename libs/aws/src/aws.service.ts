import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { CommonConstants } from 'libs/common/src/common.constant';
import { RpcException } from '@nestjs/microservices';
import { S3 } from 'aws-sdk';
import { fetchOpenBaoSecrets } from 'libs/common/src/utils/openbao.util';

@Injectable()
export class AwsService {
  private async getS3Client(): Promise<S3> {
    const secrets = await fetchOpenBaoSecrets(CommonConstants.CREDEBL_AWS_KEY_PATH);
    return new S3({
      accessKeyId: secrets.AWS_ACCESS_KEY,
      secretAccessKey: secrets.AWS_SECRET_KEY,
      region: secrets.AWS_REGION
    });
  }

  private async getPublicS3Client(): Promise<S3> {
    const secrets = await fetchOpenBaoSecrets(CommonConstants.CREDEBL_AWS_KEY_PATH);
    return new S3({
      accessKeyId: secrets.AWS_PUBLIC_ACCESS_KEY,
      secretAccessKey: secrets.AWS_PUBLIC_SECRET_KEY,
      region: secrets.AWS_PUBLIC_REGION
    });
  }

  private async getStoreObjectS3Client(): Promise<S3> {
    const secrets = await fetchOpenBaoSecrets(CommonConstants.CREDEBL_AWS_KEY_PATH);
    return new S3({
      accessKeyId: secrets.AWS_S3_STOREOBJECT_ACCESS_KEY,
      secretAccessKey: secrets.AWS_S3_STOREOBJECT_SECRET_KEY,
      region: secrets.AWS_S3_STOREOBJECT_REGION
    });
  }

  async uploadFileToS3Bucket(
    fileBuffer: Buffer,
    ext: string,
    filename: string,
    bucketName: string,
    encoding: string,
    pathAWS: string = ''
  ): Promise<string> {
    const s4 = await this.getPublicS3Client();
    const timestamp = Date.now();

    try {
      await s4
        .putObject({
          Bucket: bucketName,
          Key: `${pathAWS}/${encodeURIComponent(filename)}-${timestamp}.${ext}`,
          Body: fileBuffer,
          ContentEncoding: encoding,
          ContentType: 'image/png'
        })
        .promise();

      const imageUrl = `https://${bucketName}.s3.${process.env.AWS_PUBLIC_REGION}.amazonaws.com/${pathAWS}/${encodeURIComponent(filename)}-${timestamp}.${ext}`;
      return imageUrl;
    } catch (error) {
      throw new HttpException(error, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async uploadCsvFile(key: string, body: unknown): Promise<void> {
    const s3 = await this.getS3Client();
    const params: AWS.S3.PutObjectRequest = {
      Bucket: process.env.FILE_SHARING_BUCKET,
      Key: key,
      Body: 'string' === typeof body ? body : body.toString()
    };

    try {
      await s3.upload(params).promise();
    } catch (error) {
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async getFile(key: string): Promise<AWS.S3.GetObjectOutput> {
    const s3 = await this.getS3Client();
    const params: AWS.S3.GetObjectRequest = {
      Bucket: process.env.FILE_SHARING_BUCKET,
      Key: key
    };
    try {
      return s3.getObject(params).promise();
    } catch (error) {
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async deleteFile(key: string): Promise<void> {
    const s3 = await this.getS3Client();
    const params: AWS.S3.DeleteObjectRequest = {
      Bucket: process.env.FILE_SHARING_BUCKET,
      Key: key
    };
    try {
      await s3.deleteObject(params).promise();
    } catch (error) {
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async storeObject(persistent: boolean, key: string, body: unknown): Promise<S3.ManagedUpload.SendData> {
    const s3StoreObject = await this.getStoreObjectS3Client();
    const objKey: string = persistent.valueOf() ? `persist/${key}` : `default/${key}`;
    const buf = Buffer.from(JSON.stringify(body));
    const params: AWS.S3.PutObjectRequest = {
      Bucket: process.env.AWS_S3_STOREOBJECT_BUCKET,
      Body: buf,
      Key: objKey,
      ContentEncoding: 'base64',
      ContentType: 'application/json'
    };

    try {
      const receivedData = await s3StoreObject.upload(params).promise();
      return receivedData;
    } catch (error) {
      throw new RpcException(error.response ? error.response : error);
    }
  }
}
