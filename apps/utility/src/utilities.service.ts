import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { UtilitiesRepository } from './utilities.repository';
import { AwsService } from '@credebl/aws';
import { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from '@credebl/common/email.service';
import { EmailDto } from '@credebl/common/dtos/email.dto';

@Injectable()
export class UtilitiesService {
  private lastAlertTime: number | null = null;

  constructor(
    private readonly logger: Logger,
    private readonly utilitiesRepository: UtilitiesRepository,
    private readonly awsService: AwsService,
    private readonly emailService: EmailService
  ) {}

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
    // Avoid spamming: send only once every 2 hours
    const now = Date.now();
    if (this.lastAlertTime && now - this.lastAlertTime < 2 * 60 * 60 * 1000) {
      this.logger.log(`ALERT EMAIL ALREADY SENT at ${this.lastAlertTime}, ledgerId WAS SET TO NULL`);
      return;
    }
    this.lastAlertTime = now;

    // Send Email
    await this.emailService.sendEmail(emailDto);

    this.logger.log('ALERT EMAIL SENT, ledgerId WAS SET TO NULL');
  }
}
