import { PrismaService } from '@credebl/prisma-service';
import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line camelcase
import { platform_config, shortening_url, intent_templates} from '@prisma/client';

@Injectable()
export class UtilitiesRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger
  ) {}

  async saveShorteningUrl(payload): Promise<object> {
    try {
      const { referenceId, invitationPayload } = payload;
      const storeShorteningUrl = await this.prisma.shortening_url.upsert({
        where: { referenceId },
        update: { invitationPayload },
        create: { referenceId, invitationPayload }
      });

      this.logger.log(`[saveShorteningUrl] - shortening url details ${referenceId}`);
      return storeShorteningUrl;
    } catch (error) {
      this.logger.error(`Error in saveShorteningUrl: ${error} `);
      throw error;
    }
  }

  // eslint-disable-next-line camelcase
  async getShorteningUrl(referenceId): Promise<shortening_url> {
    try {
      const storeShorteningUrl = await this.prisma.shortening_url.findUnique({
        where: {
          referenceId
        }
      });

      this.logger.log(`[getShorteningUrl] - shortening url details ${referenceId}`);
      return storeShorteningUrl;
    } catch (error) {
      this.logger.error(`Error in getShorteningUrl: ${error} `);
      throw error;
    }
  }

  /**
   * Get platform config details
   * @returns
   */
  // eslint-disable-next-line camelcase
  async getPlatformConfigDetails(): Promise<platform_config> {
    try {
      return this.prisma.platform_config.findFirst();
    } catch (error) {
      this.logger.error(`[getPlatformConfigDetails] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }
  
  // Intent Template CRUD operations
  // eslint-disable-next-line camelcase
  async createIntentTemplate(data: {
    orgId: string;
    intentId: string;
    templateId: string;
    createdBy: string;
  }): Promise<intent_templates> {
    try {
      const intentTemplate = await this.prisma.intent_templates.create({
        data: {
          orgId: data.orgId,
          intentId: data.intentId,
          templateId: data.templateId,
          createdBy: data.createdBy,
          lastChangedBy: data.createdBy
        }
      });

      this.logger.log(`[createIntentTemplate] - Intent template created with id ${intentTemplate.id}`);
      return intentTemplate;
    } catch (error) {
      this.logger.error(`Error in createIntentTemplate: ${error}`);
      throw error;
    }
  }

  // eslint-disable-next-line camelcase
  async getIntentTemplateById(id: string): Promise<intent_templates> {
    try {
      const intentTemplate = await this.prisma.intent_templates.findUnique({
        where: { id },
        include: {
          organisation: true,
          intent: true,
          template: true
        }
      });

      this.logger.log(`[getIntentTemplateById] - Intent template details ${id}`);
      return intentTemplate;
    } catch (error) {
      this.logger.error(`Error in getIntentTemplateById: ${error}`);
      throw error;
    }
  }

  // eslint-disable-next-line camelcase
  async getIntentTemplatesByIntentId(intentId: string): Promise<intent_templates[]> {
    try {
      const intentTemplates = await this.prisma.intent_templates.findMany({
        where: { intentId },
        include: {
          organisation: true,
          intent: true,
          template: true
        }
      });

      this.logger.log(
        `[getIntentTemplatesByIntentId] - Retrieved ${intentTemplates.length} intent templates for intent ${intentId}`
      );
      return intentTemplates;
    } catch (error) {
      this.logger.error(`Error in getIntentTemplatesByIntentId: ${error}`);
      throw error;
    }
  }

  // eslint-disable-next-line camelcase
  async getIntentTemplatesByOrgId(orgId: string): Promise<intent_templates[]> {
    try {
      const intentTemplates = await this.prisma.intent_templates.findMany({
        where: { orgId },
        include: {
          organisation: true,
          intent: true,
          template: true
        }
      });

      this.logger.log(
        `[getIntentTemplatesByOrgId] - Retrieved ${intentTemplates.length} intent templates for org ${orgId}`
      );
      return intentTemplates;
    } catch (error) {
      this.logger.error(`Error in getIntentTemplatesByOrgId: ${error}`);
      throw error;
    }
  }

  // eslint-disable-next-line camelcase
  async getAllIntentTemplates(): Promise<intent_templates[]> {
    try {
      const intentTemplates = await this.prisma.intent_templates.findMany({
        include: {
          organisation: true,
          intent: true,
          template: true
        }
      });

      this.logger.log(`[getAllIntentTemplates] - Retrieved ${intentTemplates.length} intent templates`);
      return intentTemplates;
    } catch (error) {
      this.logger.error(`Error in getAllIntentTemplates: ${error}`);
      throw error;
    }
  }

  // eslint-disable-next-line camelcase
  async updateIntentTemplate(
    id: string,
    data: { orgId: string; intentId: string; templateId: string; lastChangedBy: string }
  ): Promise<intent_templates> {
    try {
      const intentTemplate = await this.prisma.intent_templates.update({
        where: { id },
        data: {
          orgId: data.orgId,
          intentId: data.intentId,
          templateId: data.templateId,
          lastChangedBy: data.lastChangedBy,
          lastChangedDateTime: new Date()
        }
      });

      this.logger.log(`[updateIntentTemplate] - Intent template updated with id ${id}`);
      return intentTemplate;
    } catch (error) {
      this.logger.error(`Error in updateIntentTemplate: ${error}`);
      throw error;
    }
  }

  // eslint-disable-next-line camelcase
  async deleteIntentTemplate(id: string): Promise<intent_templates> {
    try {
      const intentTemplate = await this.prisma.intent_templates.delete({
        where: { id }
      });

      this.logger.log(`[deleteIntentTemplate] - Intent template deleted with id ${id}`);
      return intentTemplate;
    } catch (error) {
      this.logger.error(`Error in deleteIntentTemplate: ${error}`);
      throw error;
    }
  }
}
