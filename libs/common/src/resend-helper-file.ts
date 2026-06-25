import { CommonConstants } from './common.constant';
import { EmailDto } from './dtos/email.dto';
import { Logger } from '@nestjs/common';
import { OpenBaoProvider } from 'libs/config/src/secret-storage/openbao.provider';
import { Resend } from 'resend';

let resend: Resend | null = null;

async function getResendClient(): Promise<Resend> {
  if (resend) {
    return resend;
  }
  console.log("get resend client called");
  const openBaoProvider = new OpenBaoProvider();
  const secretPath = CommonConstants.CREDEBL_RESEND_API_KEY_PATH || '';

  const secrets = await openBaoProvider.loadSecrets(secretPath);
  console.log('🔐 Successfully fetched secrets from OpenBao for Resend API Key', secrets);
  const apiKey = secrets.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY in environment variables.');
  }

  resend = new Resend(apiKey);
  return resend;
}

export const sendWithResend = async (emailDto: EmailDto): Promise<boolean> => {
  try {
    const client = await getResendClient();

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
