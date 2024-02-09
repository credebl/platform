import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { S3 } from 'aws-sdk';
import { promisify } from 'util';

@Injectable()
export class AwsService {
  private s3: S3;
  private s4: S3;

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
  }
 
  async uploadUserCertificate(
    fileBuffer: Buffer,
    ext: string,
    filename: string,
    bucketName: string,
    encoding : string,
    pathAWS: string = ''
  ): Promise<string> {
    const timestamp = Date.now();
    const putObjectAsync = promisify(this.s4.putObject).bind(this.s4);

    try {
      await putObjectAsync({
        Bucket: `${process.env.AWS_ORG_LOGO_BUCKET_NAME}`,
        Key: `${pathAWS}/${encodeURIComponent(filename)}-${timestamp}.png`,
        Body: fileBuffer,
        ContentEncoding: encoding,
        ContentType: `image/png`
      });

      const imageUrl = `https://${process.env.AWS_ORG_LOGO_BUCKET_NAME}.s3.${process.env.AWS_PUBLIC_REGION}.amazonaws.com/${pathAWS}/${encodeURIComponent(filename)}-${timestamp}.${ext}`;    
      return imageUrl;    
    } catch (error) {
      throw new HttpException(error, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async uploadCsvFile(key: string, body: unknown): Promise<void> {
    const params: AWS.S3.PutObjectRequest = {
      Bucket: process.env.AWS_BUCKET,
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
      Bucket: process.env.AWS_BUCKET,
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
      Bucket: process.env.AWS_BUCKET,
      Key: key
    };
    try {
      await this.s3.deleteObject(params).promise();
    } catch (error) {
      throw new RpcException(error.response ? error.response : error);
    }
  }
}
