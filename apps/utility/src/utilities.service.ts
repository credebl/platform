import { Injectable, NotFoundException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { UtilitiesRepository } from './utilities.repository';
import { AwsService } from '@credebl/aws';
import { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from '@credebl/common/email.service';
import { EmailDto } from '@credebl/common/dtos/email.dto';
import { BaseService } from 'libs/service/base.service';
import { ResponseMessages } from '@credebl/common/response-messages';

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

      if (!getShorteningUrl) {
        throw new NotFoundException(`Shortening URL not found for referenceId: ${referenceId}`);
      }

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
      throw new Error(
        `An error occurred while uploading data to S3: ${error instanceof Error ? error?.message : error}`
      );
    }
  }

  async handleLedgerAlert(emailDto: EmailDto): Promise<void> {
  }

  private async sendWithRetry(emailDto: EmailDto, retries = 3, delayMs = 3000): Promise<void> {
  }

  // Intent Template CRUD operations
  async createIntentTemplate(data: {
    orgId: string;
    intentId: string;
    templateId: string;
    createdBy: string;
  }): Promise<object> {
    try {
      const intentTemplate = await this.utilitiesRepository.createIntentTemplate(data);
      return intentTemplate;
    } catch (error) {
      this.logger.error(`[createIntentTemplate] - error in create intent template: ${JSON.stringify(error)}`);
      throw new RpcException(error);
    }
  }

  async getIntentTemplateById(id: string): Promise<object> {
    try {
      const intentTemplate = await this.utilitiesRepository.getIntentTemplateById(id);
      if (!intentTemplate) {
        throw new RpcException({ message: 'Intent template not found', statusCode: 404 });
      }
      return intentTemplate;
    } catch (error) {
      this.logger.error(`[getIntentTemplateById] - error in get intent template by id: ${JSON.stringify(error)}`);
      throw new RpcException(error);
    }
  }

  async getIntentTemplatesByIntentId(intentId: string): Promise<object[]> {
    try {
      const intentTemplates = await this.utilitiesRepository.getIntentTemplatesByIntentId(intentId);
      return intentTemplates;
    } catch (error) {
      this.logger.error(
        `[getIntentTemplatesByIntentId] - error in get intent templates by intent id: ${JSON.stringify(error)}`
      );
      throw new RpcException(error);
    }
  }

  async getIntentTemplatesByOrgId(orgId: string): Promise<object[]> {
    try {
      const intentTemplates = await this.utilitiesRepository.getIntentTemplatesByOrgId(orgId);
      return intentTemplates;
    } catch (error) {
      this.logger.error(
        `[getIntentTemplatesByOrgId] - error in get intent templates by org id: ${JSON.stringify(error)}`
      );
      throw new RpcException(error);
    }
  }

  async getAllIntentTemplates(): Promise<object[]> {
    try {
      const intentTemplates = await this.utilitiesRepository.getAllIntentTemplates();
      return intentTemplates;
    } catch (error) {
      this.logger.error(`[getAllIntentTemplates] - error in get all intent templates: ${JSON.stringify(error)}`);
      throw new RpcException(error);
    }
  }

  async updateIntentTemplate(
    id: string,
    data: { orgId: string; intentId: string; templateId: string; lastChangedBy: string }
  ): Promise<object> {
    try {
      const intentTemplate = await this.utilitiesRepository.updateIntentTemplate(id, data);
      return intentTemplate;
    } catch (error) {
      this.logger.error(`[updateIntentTemplate] - error in update intent template: ${JSON.stringify(error)}`);
      throw new RpcException(error);
    }
  }

  async deleteIntentTemplate(id: string): Promise<object> {
    try {
      const intentTemplate = await this.utilitiesRepository.deleteIntentTemplate(id);
      return intentTemplate;
    } catch (error) {
      this.logger.error(`[deleteIntentTemplate] - error in delete intent template: ${JSON.stringify(error)}`);
      throw new RpcException(error);
    }
  }
}
