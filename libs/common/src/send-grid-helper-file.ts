import * as dotenv from 'dotenv';
import * as sendgrid from '@sendgrid/mail';

import { EmailDto } from './dtos/email.dto';

dotenv.config();

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

export const sendWithSendGrid = async (EmailDto: EmailDto): Promise<boolean> => {
  try {
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
    return false;
  }
};
