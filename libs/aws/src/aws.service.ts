import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { S3 } from 'aws-sdk';

@Injectable()
export class AwsService {
  private s3: S3;

  constructor() {
    this.s3 = new S3({
      accessKeyId: process.env.AWS_PUBLIC_ACCESS_KEY,
      secretAccessKey: process.env.AWS_PUBLIC_SECRET_KEY,
      region: process.env.AWS_PUBLIC_REGION
    });
  }

  async uploads3(
    fileBuffer: Buffer,
    ext: string,
    pathAWS: string = '',
    encoding = 'base64',
    filename = 'nftp'
  ): Promise<string> {
    const timestamp = Date.now();
    await this.s3.putObject(
      {
        Bucket: process.env.AWS_PUBLIC_BUCKET_NAME,
        Key: `${pathAWS}/${encodeURIComponent(filename)}.${timestamp}.${ext}`,
        Body: fileBuffer.toString(),
        ContentEncoding: encoding
      },
      (err) => {
        if (err) {
          throw new HttpException('An error occurred while uploading the image', HttpStatus.SERVICE_UNAVAILABLE);
        } else {
          return 'photo is uploaded';
        }
      }
    );

    return `https://${process.env.AWS_PUBLIC_BUCKET_NAME}.s3.amazonaws.com/${pathAWS}/${encodeURIComponent(
      filename
    )}-${timestamp}.${ext}`;
  }

  async fileUpload(file: Express.Multer.File): Promise<string> {
    const fileExt = file['originalname'].split('.')[file['originalname'].split('.').length - 1];
    if ('image/png' === file['mimetype'] || 'image/jpg' === file['mimetype'] || 'image/jpeg' === file['mimetype']) {
      const awsResponse = await this.uploads3(file['buffer'], fileExt, file['mimetype'], 'images');
      return awsResponse;
    } else {
      throw new BadRequestException('File format should be PNG,JPG,JPEG');
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
