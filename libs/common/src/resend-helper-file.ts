import { CommonConstants } from './common.constant';
import { EmailDto } from './dtos/email.dto';
import { Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { fetchSecrets } from './utils/secretLoader.util';

let resendClientPromise: Promise<Resend> | undefined;

async function getResendClient(): Promise<Resend> {
  resendClientPromise ??= (async (): Promise<Resend> => {
    const secretPath = CommonConstants.CREDEBL_RESEND_API_KEY_PATH;
    const secrets = await fetchSecrets(secretPath);
    const apiKey = secrets.RESEND_API_KEY ?? process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error('Missing RESEND_API_KEY in secret payload.');
    }

    return new Resend(apiKey);
  })();

  return resendClientPromise;
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
