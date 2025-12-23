import { Injectable, Logger } from '@nestjs/common';

import { CommonConstants } from './common.constant';
import { EmailDto } from './dtos/email.dto';
import { sendWithResend } from './resend-helper-file';
import { sendWithSMTP } from './smtp-helper-file';
import { sendWithSendGrid } from './send-grid-helper-file';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendEmail(emailDto: EmailDto): Promise<boolean> {
    const provider = process.env.EMAIL_PROVIDER?.toLowerCase();

    this.logger.debug(`Email Provider is: ${provider}`);
    let result: boolean;

    try {
      switch (provider) {
        case CommonConstants.SENDGRID_EMAIL_PROVIDER:
          result = await sendWithSendGrid(emailDto);
          break;
        case CommonConstants.RESEND_EMAIL_PROVIDER:
          result = await sendWithResend(emailDto);
          break;
        case CommonConstants.SMTP_EMAIL_PROVIDER:
          result = await sendWithSMTP(emailDto);
          break;
        default:
          this.logger.warn(`Unknown email provider: ${provider}`);
          return false;
      }
    } catch (error) {
      this.logger.error(`Failed to send email using ${provider}: ${error.message}`);
      throw error;
    }
    return result;
  }
}
