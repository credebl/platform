import { Injectable, NotFoundException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { UtilitiesRepository } from './utilities.repository';
import {
  IIntentTemplateList,
  IIntentTemplateSearchCriteria
} from '@credebl/common/interfaces/intents-template.interface';
import { AwsService } from '@credebl/aws';
import { ErrorHandler } from '@credebl/common/utils/error-handler.util';
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

    const platformConfigData = await this.utilitiesRepository.getPlatformConfigDetails();
    if (!platformConfigData) {
      throw new NotFoundException(ResponseMessages.issuance.error.platformConfigNotFound);
    }

    emailDto.emailFrom = platformConfigData?.emailFrom;

    // 3. Start async retry flow — do not block the caller
    this.isSendingAlert = true;
    this.sendWithRetry(emailDto).finally(() => {
      this.isSendingAlert = false;
    });
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

  // Intent Template CRUD operations
  async createIntentTemplate(data: {
    orgId?: string;

    intentId: string;
    templateId: string;
    user: { id: string };
  }): Promise<object> {
    try {
      const { user, ...templateData } = data;

      // Validate input
      if (!templateData.intentId || !templateData.templateId || !user.id) {
        throw new Error('Invalid data: intentId, templateId, and user are required');
      }

      // Call repository — may throw Error (duplicate check, DB errors)
      const intentTemplate = await this.utilitiesRepository.createIntentTemplate({
        ...templateData,
        createdBy: user.id
      });

      this.logger.log(`[createIntentTemplate] - Intent template created with id ${intentTemplate.id}`);
      return intentTemplate;
    } catch (error) {
      const errorResponse = ErrorHandler.categorize(error, 'Failed to create intent template');
      this.logger.error(
        `[createIntentTemplate] - ${errorResponse.statusCode}: ${errorResponse.message}`,
        ErrorHandler.format(error)
      );
      throw new RpcException(errorResponse);
    }
  }

  async getIntentTemplateById(id: string): Promise<object> {
    try {
      const intentTemplate = await this.utilitiesRepository.getIntentTemplateById(id);
      if (!intentTemplate) {
        throw new Error('Intent template not found');
      }
      return intentTemplate;
    } catch (error) {
      const errorResponse = ErrorHandler.categorize(error, 'Failed to retrieve intent template');
      this.logger.error(
        `[getIntentTemplateById] - ${errorResponse.statusCode}: ${errorResponse.message}`,
        ErrorHandler.format(error)
      );
      throw new RpcException(errorResponse);
    }
  }

  async getIntentTemplatesByIntentId(intentId: string): Promise<object[]> {
    try {
      const intentTemplates = await this.utilitiesRepository.getIntentTemplatesByIntentId(intentId);
      return intentTemplates;
    } catch (error) {
      const errorResponse = ErrorHandler.categorize(error, 'Failed to retrieve intent templates');
      this.logger.error(
        `[getIntentTemplatesByIntentId] - ${errorResponse.statusCode}: ${errorResponse.message}`,
        ErrorHandler.format(error)
      );
      throw new RpcException(errorResponse);
    }
  }

  async getIntentTemplatesByOrgId(orgId: string): Promise<object[]> {
    try {
      const intentTemplates = await this.utilitiesRepository.getIntentTemplatesByOrgId(orgId);
      return intentTemplates;
    } catch (error) {
      const errorResponse = ErrorHandler.categorize(error, 'Failed to retrieve intent templates');
      this.logger.error(
        `[getIntentTemplatesByOrgId] - ${errorResponse.statusCode}: ${errorResponse.message}`,
        ErrorHandler.format(error)
      );
      throw new RpcException(errorResponse);
    }
  }

  async getAllIntentTemplateByQuery(payload: {
    intentTemplateSearchCriteria: IIntentTemplateSearchCriteria;
  }): Promise<IIntentTemplateList> {
    try {
      const { intentTemplateSearchCriteria } = payload;
      const result = await this.utilitiesRepository.getAllIntentTemplateByQuery(intentTemplateSearchCriteria);
      return result;
    } catch (error) {
      const errorResponse = ErrorHandler.categorize(error, 'Failed to retrieve intent templates');
      this.logger.error(
        `[getAllIntentTemplateByQuery] - ${errorResponse.statusCode}: ${errorResponse.message}`,
        ErrorHandler.format(error)
      );
      throw new RpcException(errorResponse);
    }
  }

  async getIntentTemplateByIntentAndOrg(intentName: string, verifierOrgId: string): Promise<object | null> {
    try {
      const intentTemplate = await this.utilitiesRepository.getIntentTemplateByIntentAndOrg(intentName, verifierOrgId);
      if (!intentTemplate) {
        this.logger.log(
          `[getIntentTemplateByIntentAndOrg] - No template found for intent ${intentName} and org ${verifierOrgId}`
        );
        return null;
      }
      return intentTemplate;
    } catch (error) {
      const errorResponse = ErrorHandler.categorize(error, 'Failed to retrieve intent template');
      this.logger.error(
        `[getIntentTemplateByIntentAndOrg] - ${errorResponse.statusCode}: ${errorResponse.message}`,
        ErrorHandler.format(error)
      );
      throw new RpcException(errorResponse);
    }
  }

  async updateIntentTemplate(
    id: string,
    data: { orgId: string; intentId: string; templateId: string; user: { id: string } }
  ): Promise<object> {
    try {
      const { user, ...templateData } = data;
      const intentTemplate = await this.utilitiesRepository.updateIntentTemplate(id, {
        ...templateData,
        lastChangedBy: user.id
      });
      return intentTemplate;
    } catch (error) {
      const errorResponse = ErrorHandler.categorize(error, 'Failed to update intent template');
      this.logger.error(
        `[updateIntentTemplate] - ${errorResponse.statusCode}: ${errorResponse.message}`,
        ErrorHandler.format(error)
      );
      throw new RpcException(errorResponse);
    }
  }

  async deleteIntentTemplate(id: string): Promise<object> {
    try {
      const intentTemplate = await this.utilitiesRepository.deleteIntentTemplate(id);
      return intentTemplate;
    } catch (error) {
      const errorResponse = ErrorHandler.categorize(error, 'Failed to delete intent template');
      this.logger.error(
        `[deleteIntentTemplate] - ${errorResponse.statusCode}: ${errorResponse.message}`,
        ErrorHandler.format(error)
      );
      throw new RpcException(errorResponse);
    }
  }
}
