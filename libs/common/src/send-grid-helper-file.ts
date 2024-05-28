import * as sendgrid from '@sendgrid/mail';
import * as dotenv from 'dotenv';
import { EmailDto } from './dtos/email.dto';
import { Logger } from '@nestjs/common';

dotenv.config();

export const sendWithSendGrid = async (emailDto: EmailDto): Promise<boolean> => {
  try {
    Logger.debug(`Inside sendWithSendGrid Method::Sending email via sendGrid`);
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
    return await sendgrid
      .send({
        to: emailDto.emailTo,
        from: emailDto.emailFrom,
        subject: emailDto.emailSubject,
        text: emailDto.emailText,
        html: emailDto.emailHtml,
        attachments: emailDto.emailAttachments
      })
      .then(() => true)
      .catch(() => false);
  } catch (error) {
    Logger.error('Error while sending email with SendGrid', error);
    return false;
  }
};
