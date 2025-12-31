import * as dotenv from 'dotenv';
import * as nodemailer from 'nodemailer';

import { EmailDto } from './dtos/email.dto';
import { Logger } from '@nestjs/common';

dotenv.config();

const emailProvider = process.env.EMAIL_PROVIDER?.toLowerCase();

let transporter: nodemailer.Transporter | null = null;

if ('smtp' === emailProvider) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error('Missing SMTP configuration. Required: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
  }

  const port = Number(SMTP_PORT);

  if (!Number.isInteger(port) || 0 >= port) {
    throw new Error(`Invalid SMTP_PORT value: "${SMTP_PORT}". Must be a valid number.`);
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: 465 === Number(SMTP_PORT),
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    },
    requireTLS: 587 === Number(SMTP_PORT)
  });
}

export const sendWithSMTP = async (emailDto: EmailDto): Promise<boolean> => {
  if (!transporter) {
    Logger.error('SMTP email provider is not initialized');
    return false;
  }

  try {
    await transporter.sendMail({
      from: emailDto.emailFrom,
      to: emailDto.emailTo,
      subject: emailDto.emailSubject,
      text: emailDto.emailText,
      html: emailDto.emailHtml,
      attachments: emailDto.emailAttachments
    });

    return true;
  } catch (error) {
    Logger.error('Error while sending email with SMTP', error);
    return false;
  }
};
