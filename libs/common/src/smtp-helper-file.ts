import * as nodemailer from 'nodemailer';

import { CommonConstants } from './common.constant';
import { EmailDto } from './dtos/email.dto';
import { Logger } from '@nestjs/common';
import { fetchSecrets } from './utils/secretLoader.util';

export interface SmtpTransportConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  requireTLS: boolean;
}

export const buildSmtpTransportConfig = (
  smtpHost: string,
  smtpPort: string,
  smtpUser: string,
  smtpPass: string
): SmtpTransportConfig => {
  const port = Number(smtpPort);

  if (!Number.isInteger(port) || 0 >= port) {
    throw new Error(`Invalid SMTP_PORT value: "${smtpPort}". Must be a valid number.`);
  }

  return {
    host: smtpHost,
    port,
    secure: 465 === port,
    auth: {
      user: smtpUser,
      pass: smtpPass
    },
    requireTLS: 587 === port
  };
};

export const sendWithSMTP = async (emailDto: EmailDto): Promise<boolean> => {
  try {
    const secretPath = CommonConstants.CREDEBL_SMTP_CONFIG_PATH;
    const secrets = await fetchSecrets(secretPath);
    const smtpHost = secrets.SMTP_HOST ?? process.env.SMTP_HOST;
    const smtpPort = secrets.SMTP_PORT ?? process.env.SMTP_PORT;
    const smtpUser = secrets.SMTP_USER ?? process.env.SMTP_USER;
    const smtpPass = secrets.SMTP_PASS ?? process.env.SMTP_PASS;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      throw new Error('Missing SMTP configuration. Required: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
    }

    // TLS is enforced by buildSmtpTransportConfig (implicit TLS on 465, STARTTLS on 587);
    // plaintext applies only to non-standard ports and is required for the local integration tests.
    const transporter = nodemailer.createTransport(buildSmtpTransportConfig(smtpHost, smtpPort, smtpUser, smtpPass)); // NOSONAR typescript:S5332

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
