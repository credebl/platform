import { EmailDto } from './dtos/email.dto';
import { Logger } from '@nestjs/common';
import { Resend } from 'resend';

let resend: Resend | null = null;

function getResendClient(): Resend {
  if (resend) {
    return resend;
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY in environment variables.');
  }

  resend = new Resend(apiKey);
  return resend;
}

export const sendWithResend = async (emailDto: EmailDto): Promise<boolean> => {
  try {
    const client = getResendClient();

    const response = await client.emails.send({
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
