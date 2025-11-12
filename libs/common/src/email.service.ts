import { Injectable, Logger } from '@nestjs/common';

import { CommonConstants } from './common.constant';
import { EmailDto } from './dtos/email.dto';
import { sendWithResend } from './resend-helper-file';
import { sendWithSendGrid } from './send-grid-helper-file';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendEmail(emailDto: EmailDto): Promise<boolean> {
    const provider = process.env.EMAIL_PROVIDER?.toLowerCase() || CommonConstants.DEFAULT_EMAIL_PROVIDER;

    this.logger.debug(`Email Provider is: ${provider}`);
    let result: boolean;

    try {
      switch (provider) {
        case 'sendgrid':
          result = await sendWithSendGrid(emailDto);
          break;
        case 'resend':
          result = await sendWithResend(emailDto);
          break;
        default:
          this.logger.warn(`Unknown email provider: ${provider}, defaulting to SendGrid.`);
          result = await sendWithSendGrid(emailDto);
      }
    } catch (error) {
      this.logger.error(`Failed to send email using ${provider}: ${error.message}`);
      throw error;
    }

    return result;
  }
}
