import * as dotenv from 'dotenv';

import { EmailDto } from './dtos/email.dto';
import { Logger } from '@nestjs/common';
import { Resend } from 'resend';

dotenv.config();

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  throw new Error('Missing RESEND_API_KEY in environment variables.');
}
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendWithResend = async (emailDto: EmailDto): Promise<boolean> => {
  try {
    const response = await resend.emails.send({
      from: emailDto.emailFrom,
      to: emailDto.emailTo,
      subject: emailDto.emailSubject,
      text: emailDto.emailText,
      html: emailDto.emailHtml,
      attachments: emailDto.emailAttachments
    });

    return Boolean(response.data?.id);
  } catch (error) {
    Logger.error('Error while sending email with Resend', error);
    return false;
  }
};
