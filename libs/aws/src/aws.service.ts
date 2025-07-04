import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { S3 } from 'aws-sdk';
import { promisify } from 'util';
import { CommonConstants } from '@credebl/common/common.constant';

@Injectable()
export class AwsService {
  private s3: S3;
  private s4: S3;
  private s3StoreObject: S3;
  private readonly TYPE = 'image/png';

  constructor() {
    this.s3 = new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
      region: process.env.AWS_REGION
    });

    this.s4 = new S3({
      accessKeyId: process.env.AWS_PUBLIC_ACCESS_KEY,
      secretAccessKey: process.env.AWS_PUBLIC_SECRET_KEY,
      region: process.env.AWS_PUBLIC_REGION
    });

    this.s3StoreObject = new S3({
      accessKeyId: process.env.AWS_S3_STOREOBJECT_ACCESS_KEY,
      secretAccessKey: process.env.AWS_S3_STOREOBJECT_SECRET_KEY,
      region: process.env.AWS_S3_STOREOBJECT_REGION
    });
  }

  async uploadFileToBucket(
    fileBuffer: Buffer,
    ext: string,
    filename: string,
    bucketName: string,
    encoding: string,
    filePath: string = ''
  ): Promise<string> {
    const timestamp = Date.now();
    const putObjectAsync = promisify(this.s4.putObject).bind(this.s4);

    try {
      await putObjectAsync({
        Bucket: `${bucketName}`,
        Key: `${filePath}/${encodeURIComponent(filename)}-${timestamp}.${ext}`,
        Body: fileBuffer,
        ContentEncoding: encoding,
        ContentType: this.TYPE
      });

      const imageUrl = `https://${bucketName}.s3.${
        process.env.AWS_PUBLIC_REGION
      }.amazonaws.com/${filePath}/${encodeURIComponent(filename)}-${timestamp}.${ext}`;
      return imageUrl;
    } catch (error) {
      throw new HttpException(error, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async uploadCsvFile(key: string, body: unknown): Promise<void> {
    const params: AWS.S3.PutObjectRequest = {
      Bucket: process.env.FILE_BUCKET,
      Key: key,
      Body: 'string' === typeof body ? body : body.toString()
    };

    try {
      await this.s3.upload(params).promise();
    } catch (error) {
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async getFile(key: string): Promise<AWS.S3.GetObjectOutput> {
    const params: AWS.S3.GetObjectRequest = {
      Bucket: process.env.FILE_BUCKET,
      Key: key
    };
    try {
      return this.s3.getObject(params).promise();
    } catch (error) {
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async deleteFile(key: string): Promise<void> {
    const params: AWS.S3.DeleteObjectRequest = {
      Bucket: process.env.FILE_BUCKET,
      Key: key
    };
    try {
      await this.s3.deleteObject(params).promise();
    } catch (error) {
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async storeObject(persistent: boolean, key: string, body: unknown): Promise<S3.ManagedUpload.SendData> {
    const objKey: string = persistent.valueOf() ? `persist/${key}` : `default/${key}`;
    const buf = Buffer.from(JSON.stringify(body));
    const params: AWS.S3.PutObjectRequest = {
      Bucket: process.env.STORE_OBJECT_BUCKET,
      Body: buf,
      Key: objKey,
      ContentEncoding: CommonConstants.ENCODING.toString(),
      ContentType: 'application/json'
    };

    try {
      const receivedData = await this.s3StoreObject.upload(params).promise();
      return receivedData;
    } catch (error) {
      throw new RpcException(error.response ? error.response : error);
    }
  }
}
