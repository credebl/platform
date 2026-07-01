import * as sendgrid from '@sendgrid/mail';

import { CommonConstants } from './common.constant';
import { EmailDto } from './dtos/email.dto';
import { Logger } from '@nestjs/common';
import { fetchSecrets } from './utils/secretLoader.util';

let sendgridInitPromise: Promise<void> | undefined;

async function initSendgrid(): Promise<void> {
  sendgridInitPromise ??= (async (): Promise<void> => {
    const secretPath = CommonConstants.CREDEBL_SENDGRID_API_KEY_PATH;
    const secrets = await fetchSecrets(secretPath);
    const apiKey = secrets.SENDGRID_API_KEY ?? process.env.SENDGRID_API_KEY;

    if (!apiKey) {
      throw new Error('Missing SENDGRID_API_KEY in secret payload.');
    }

    sendgrid.setApiKey(apiKey);
  })();

  return sendgridInitPromise;
}

export const sendWithSendGrid = async (EmailDto: EmailDto): Promise<boolean> => {
  try {
    await initSendgrid();
    const msg = {
      to: EmailDto.emailTo,
      from: EmailDto.emailFrom,
      subject: EmailDto.emailSubject,
      text: EmailDto.emailText,
      html: EmailDto.emailHtml,
      attachments: EmailDto.emailAttachments
    };
    return await sendgrid
      .send(msg)
      .then(() => true)
      .catch(() => false);
  } catch (error) {
    Logger.error('Error while sending email with SendGrid', error);
    return false;
  }
};
