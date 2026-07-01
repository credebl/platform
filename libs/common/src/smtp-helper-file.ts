import * as nodemailer from 'nodemailer';

import { CommonConstants } from './common.constant';
import { EmailDto } from './dtos/email.dto';
import { Logger } from '@nestjs/common';
import { fetchSecrets } from './utils/secretLoader.util';

let transporterPromise: Promise<nodemailer.Transporter> | undefined;

async function getSmtpTransporter(): Promise<nodemailer.Transporter> {
  transporterPromise ??= (async (): Promise<nodemailer.Transporter> => {
    const secretPath = CommonConstants.CREDEBL_SMTP_CONFIG_PATH;
    const secrets = await fetchSecrets(secretPath);
    const smtpHost = secrets.SMTP_HOST ?? process.env.SMTP_HOST;
    const smtpPort = secrets.SMTP_PORT ?? process.env.SMTP_PORT;
    const smtpUser = secrets.SMTP_USER ?? process.env.SMTP_USER;
    const smtpPass = secrets.SMTP_PASS ?? process.env.SMTP_PASS;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      throw new Error('Missing SMTP configuration. Required: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
    }

    const port = Number(smtpPort);

    if (!Number.isInteger(port) || 0 >= port) {
      throw new Error(`Invalid SMTP_PORT value: "${smtpPort}". Must be a valid number.`);
    }

    return nodemailer.createTransport({
      host: smtpHost,
      port,
      secure: 465 === port,
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      requireTLS: 587 === port
    });
  })();

  return transporterPromise;
}

export const sendWithSMTP = async (emailDto: EmailDto): Promise<boolean> => {
  try {
    const transporter = await getSmtpTransporter();
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
