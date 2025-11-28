import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { UtilitiesRepository } from './utilities.repository';
import { AwsService } from '@credebl/aws';
import { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from '@credebl/common/email.service';
import { EmailDto } from '@credebl/common/dtos/email.dto';
import { BaseService } from 'libs/service/base.service';

@Injectable()
export class UtilitiesService extends BaseService {
  private lastAlertTime: number | null = null;
  private isSendingAlert = false; // Prevent concurrent retries

  constructor(
    private readonly utilitiesRepository: UtilitiesRepository,
    private readonly awsService: AwsService,
    private readonly emailService: EmailService
  ) {
    super('UtilitiesService');
  }

  async createAndStoreShorteningUrl(payload): Promise<string> {
    try {
      const { credentialId, schemaId, credDefId, invitationUrl, attributes } = payload;
      const invitationPayload = {
        referenceId: credentialId,
        invitationPayload: {
          schemaId,
          credDefId,
          invitationUrl,
          attributes
        }
      };
      await this.utilitiesRepository.saveShorteningUrl(invitationPayload);
      return `${process.env.API_GATEWAY_PROTOCOL}://${process.env.API_ENDPOINT}/invitation/qr-code/${credentialId}`;
    } catch (error) {
      this.logger.error(`[createAndStoreShorteningUrl] - error in create shortening url: ${JSON.stringify(error)}`);
      throw new RpcException(error);
    }
  }

  async getShorteningUrl(referenceId: string): Promise<object> {
    try {
      const getShorteningUrl = await this.utilitiesRepository.getShorteningUrl(referenceId);

      const getInvitationUrl = {
        referenceId: getShorteningUrl.referenceId,
        invitationPayload: getShorteningUrl.invitationPayload
      };

      return getInvitationUrl;
    } catch (error) {
      this.logger.error(`[getShorteningUrl] - error in get shortening url: ${JSON.stringify(error)}`);
      throw new RpcException(error);
    }
  }

  async storeObject(payload: { persistent: boolean; storeObj: unknown }): Promise<string> {
    try {
      const uuid = uuidv4();
      const uploadResult: S3.ManagedUpload.SendData = await this.awsService.storeObject(
        payload.persistent,
        uuid,
        payload.storeObj
      );
      const url: string = `${process.env.SHORTENED_URL_DOMAIN}/${uploadResult.Key}`;
      return url;
    } catch (error) {
      this.logger.error(error);
      throw new Error('An error occurred while uploading data to S3. Error::::::');
    }
  }

  async handleLedgerAlert(emailDto: EmailDto): Promise<void> {
    const now = Date.now();

    // 1. Avoid more than once every 2 hours
    if (this.lastAlertTime && now - this.lastAlertTime < 2 * 60 * 60 * 1000) {
      this.logger.log(`ALERT EMAIL ALREADY SENT at ${new Date(this.lastAlertTime).toISOString()}`);
      return;
    }

    // 2. If a retry flow is already in progress, do NOT start another
    if (this.isSendingAlert) {
      this.logger.log('Alert email sending already in progress, skipping...');
      return;
    }

    // 3. Start async retry flow — do not block the caller
    this.isSendingAlert = true;
    this.sendWithRetry(emailDto).finally(() => {
      this.isSendingAlert = false;
    });

    // immediate return
  }

  private async sendWithRetry(emailDto: EmailDto, retries = 3, delayMs = 3000): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await this.emailService.sendEmail(emailDto);

        if (true !== result) {
          throw new Error('Email not sent');
        }

        // Success
        this.lastAlertTime = Date.now();
        this.logger.log(`ALERT EMAIL SENT SUCCESSFULLY (attempt ${attempt})`);
        return;
      } catch (err) {
        this.logger.error(
          `Email send failed (attempt ${attempt} of ${retries})`,
          err instanceof Error ? err.stack : err
        );

        // If last attempt → throw
        if (attempt === retries) {
          this.logger.error('All email retry attempts failed.');
          return;
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
}
