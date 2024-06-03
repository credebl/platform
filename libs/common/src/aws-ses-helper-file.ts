import * as dotenv from 'dotenv';
import { EmailDto } from './dtos/email.dto';
import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as AWS from 'aws-sdk';

dotenv.config();

export const sendWithSES = async (emailDto: EmailDto): Promise<boolean> => {
  const awsSES = new AWS.SES({
    apiVersion: process.env.AWS_SES_VERSION,
    region: process.env.AWS_SES_REGION,
    credentials: {
      accessKeyId: process.env.AWS_SES_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SES_SECRET_KEY
    },
    endpoint: `https://email.${process.env.AWS_SES_REGION}.amazonaws.com`
  });

  const transporter = nodemailer.createTransport({
    SES: awsSES,
    secure: true
  });

  try {
    return await transporter
      .sendMail({
        from: emailDto.emailFrom,
        to: emailDto.emailTo,
        subject: emailDto.emailSubject,
        text: emailDto.emailText,
        html: emailDto.emailHtml,
        attachments: emailDto.emailAttachments
      })
      .then(() => true)
      .catch(() => false);
  } catch (error) {
    Logger.error('Error while sending email with Amazon SES', error);
    return false;
  }
};
