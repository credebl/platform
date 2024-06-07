import { Injectable, Logger } from '@nestjs/common';
import { EmailDto } from './dtos/email.dto';
import { sendWithSendGrid } from '@credebl/common/send-grid-helper-file';
import { sendWithSES } from '@credebl/common/aws-ses-helper-file';
import { sendWithSMTP } from '@credebl/common/smtp-helper-file';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor() {}
  async sendEmail(emailDto: EmailDto): Promise<boolean> {
    const provider = process.env.EMAIL_PROVIDER;
    let result: boolean;
    if (!provider) {
      throw new Error('Email provider is not set in environment variables. Please provide email service provider property.');
    }
    try {
      switch (provider) {
        case 'ses':
          result = await sendWithSES(emailDto);
          break;
        case 'sendGrid':
          result = await sendWithSendGrid(emailDto);
          break;
        case 'smtp':
          result = await sendWithSMTP(emailDto);
          break;
        default:
          this.logger.warn(`Unknown email provider: ${provider}. Defaulting to SendGrid.`);
          result = await sendWithSendGrid(emailDto);
          break;
      }
    } catch (error) {
      throw new Error(`Failed to send email using ${provider} provider: ${error.message}`);
    }
    return result;
  }
}
