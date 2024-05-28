import * as dotenv from 'dotenv';
import { EmailDto } from './dtos/email.dto';
import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import AWS = require('aws-sdk');

dotenv.config();

export const sendWithSES = async (emailDto: EmailDto): Promise<boolean> => {
  const { AWS_SES_ACCESS_KEY: accessKeyId, AWS_SES_SECRET_KEY: secretAccessKey, AWS_SES_REGION: region } = process.env;
  Logger.debug(`Inside sendWithSES Method:: Sending Email via AWS SES - Region: ${region}`);

  // Create ses service object
  const awsSES = new AWS.SES({
    apiVersion: '2010-12-01',
    region,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });

  // create an SES transporter using NodeMailer
  const transporter = nodemailer.createTransport({
    SES: { awsSES, aws: AWS }
  });

  try {
    const info = await transporter
      .sendMail({
        from: emailDto.emailFrom,
        to: emailDto.emailTo, //list  of receivers
        subject: emailDto.emailSubject,
        text: emailDto.emailText,
        html: emailDto.emailHtml,
        attachments: emailDto.emailAttachments
      })
      .then(() => true)
      .catch(() => false);
  } catch (error) {
    Logger.error('Error sending email with Amazon SES', error);
    return false;
  }
};
