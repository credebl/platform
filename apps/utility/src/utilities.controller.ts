import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { UtilitiesService } from './utilities.service';
import { IShorteningUrlData } from '../interfaces/shortening-url.interface';
import { EmailDto } from '@credebl/common/dtos/email.dto';
import {
  IIntentTemplateSearchCriteria,
  IIntentTemplateList
} from '@credebl/common/interfaces/intents-template.interface';

@Controller()
export class UtilitiesController {
  constructor(
    private readonly utilitiesService: UtilitiesService,
    private readonly logger: Logger
  ) {}

  @MessagePattern({ cmd: 'create-shortening-url' })
  async createAndStoreShorteningUrl(payload: IShorteningUrlData): Promise<string> {
    return this.utilitiesService.createAndStoreShorteningUrl(payload);
  }

  @MessagePattern({ cmd: 'get-shortening-url' })
  async getShorteningUrl(referenceId: string): Promise<object> {
    return this.utilitiesService.getShorteningUrl(referenceId);
  }

  @MessagePattern({ cmd: 'store-object-return-url' })
  async storeObject(payload: { persistent: boolean; storeObj: unknown }): Promise<string> {
    try {
      const url: string = await this.utilitiesService.storeObject(payload);
      return url;
    } catch (error) {
      this.logger.error(error);
      throw new Error('Error occured in Utility Microservices Controller');
    }
  }

  @MessagePattern({ cmd: 'alert-db-ledgerId-null' })
  async handleLedgerAlert(payload: { emailDto: EmailDto }): Promise<void> {
    try {
      this.logger.debug('Received msg in alert-db-service');
      const result = await this.utilitiesService.handleLedgerAlert(payload.emailDto);
      this.logger.debug('Received result in alert-db-service');
      return result;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
  
  // Intent Template CRUD operations
  @MessagePattern({ cmd: 'create-intent-template' })
  async createIntentTemplate(payload: {
    orgId?: string;
    intentId: string;
    templateId: string;
    user: { id: string };
  }): Promise<object> {
    return this.utilitiesService.createIntentTemplate(payload);
  }

  @MessagePattern({ cmd: 'get-intent-template-by-id' })
  async getIntentTemplateById(id: string): Promise<object> {
    return this.utilitiesService.getIntentTemplateById(id);
  }

  @MessagePattern({ cmd: 'get-intent-templates-by-intent-id' })
  async getIntentTemplatesByIntentId(intentId: string): Promise<object[]> {
    return this.utilitiesService.getIntentTemplatesByIntentId(intentId);
  }

  @MessagePattern({ cmd: 'get-intent-templates-by-org-id' })
  async getIntentTemplatesByOrgId(orgId: string): Promise<object[]> {
    return this.utilitiesService.getIntentTemplatesByOrgId(orgId);
  }

  @MessagePattern({ cmd: 'get-all-intent-templates-by-query' })
  async getAllIntentTemplateByQuery(payload: {
    intentTemplateSearchCriteria: IIntentTemplateSearchCriteria;
  }): Promise<IIntentTemplateList> {
    return this.utilitiesService.getAllIntentTemplateByQuery(payload);
  }

  @MessagePattern({ cmd: 'get-intent-template-by-intent-and-org' })
  async getIntentTemplateByIntentAndOrg(payload: {
    intentName: string;
    verifierOrgId: string;
  }): Promise<object | null> {
    return this.utilitiesService.getIntentTemplateByIntentAndOrg(payload.intentName, payload.verifierOrgId);
  }

  @MessagePattern({ cmd: 'update-intent-template' })
  async updateIntentTemplate(payload: {
    id: string;
    orgId: string;
    intentId: string;
    templateId: string;
    user: { id: string };
  }): Promise<object> {
    return this.utilitiesService.updateIntentTemplate(payload.id, {
      orgId: payload.orgId,
      intentId: payload.intentId,
      templateId: payload.templateId,
      user: payload.user
    });
  }

  @MessagePattern({ cmd: 'delete-intent-template' })
  async deleteIntentTemplate(id: string): Promise<object> {
    return this.utilitiesService.deleteIntentTemplate(id);
  }
}
