import * as dotenv from 'dotenv';
import { EmailDto } from './dtos/email.dto';
import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

dotenv.config();

export const sendWithSMTP = async (emailDto: EmailDto): Promise<boolean> => {
  const { SMTP_HOST: host, SMTP_PORT: port, SMTP_USER: user, SMTP_PASS: pass } = process.env;
  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(port, 10),
    auth: { user, pass }
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
    Logger.error('Error while sending email with SMTP', error);
    return false;
  }
};