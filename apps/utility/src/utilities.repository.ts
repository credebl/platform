import {
  IIntentTemplateList,
  IIntentTemplateSearchCriteria
} from '@credebl/common/interfaces/intents-template.interface';
import { PrismaService } from '@credebl/prisma-service';
import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line camelcase
import { platform_config, shortening_url, intent_templates} from '@prisma/client';
import { SortValue } from '@credebl/enum/enum';

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
    orgId?: string;
    intentId: string;
    templateId: string;
    createdBy: string;
    // eslint-disable-next-line camelcase
  }): Promise<intent_templates> {
    try {
      // Check if a template already exists for this intent and org combination
      const existingTemplate = await this.prisma.intent_templates.findFirst({
        where: {
          intentId: data.intentId,
          orgId: data.orgId || null // null if orgId is not provided (global template)
        }
      });

      if (existingTemplate) {
        const scope = data.orgId ? `org ${data.orgId}` : 'globally';
        this.logger.warn(`[createIntentTemplate] - Template already exists for intent ${data.intentId} ${scope}`);
        throw new Error(
          `A template is already assigned to this intent for ${scope}. Only one template per intent per organization is allowed.`
        );
      }

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

  // eslint-disable-next-line camelcase
  async updateIntentTemplate(
    id: string,
    data: { orgId: string; intentId: string; templateId: string; lastChangedBy: string }
    // eslint-disable-next-line camelcase
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

  // eslint-disable-next-line camelcase
  async getIntentTemplateByIntentAndOrg(intentName: string, verifierOrgId: string): Promise<intent_templates | null> {
    try {
      const template = await this.prisma.intent_templates.findFirst({
        where: {
          intent: { is: { name: intentName } },
          OR: [{ orgId: verifierOrgId }, { orgId: null }]
        },
        select: {
          id: true,
          createDateTime: true,
          lastChangedDateTime: true,
          createdBy: true,
          lastChangedBy: true,
          intentId: true,
          templateId: true,
          orgId: true,
          intent: { select: { name: true } },
          template: {
            select: { name: true, templateJson: true, orgId: true, organisation: { select: { name: true } } }
          },
          organisation: { select: { name: true } }
        },
        // include: {
        //   organisation: true,
        //   intent: true,
        //   template: true
        // },
        orderBy: [{ orgId: { sort: 'desc', nulls: 'last' } }] // org-specific first, null last
      });

      if (template) {
        this.logger.log(
          `[getIntentTemplateByIntentAndOrg] - Found template for intent ${intentName} and org ${verifierOrgId}`
        );
        return template;
      }

      this.logger.log(
        `[getIntentTemplateByIntentAndOrg] - No template found for intent ${intentName} and org ${verifierOrgId}`
      );
      return null;
    } catch (error) {
      this.logger.error(`Error in getIntentTemplateByIntentAndOrg: ${error}`);
      throw error;
    }
  }

  async getAllIntentTemplateByQuery(
    intentTemplateSearchCriteria: IIntentTemplateSearchCriteria
  ): Promise<IIntentTemplateList> {
    try {
      const pageNumber = Number(intentTemplateSearchCriteria.pageNumber) || 1;
      const pageSize = Number(intentTemplateSearchCriteria.pageSize) || 10;

      const whereClause: Record<string, unknown> = {};
      if (intentTemplateSearchCriteria.id) {
        whereClause.id = intentTemplateSearchCriteria.id;
      }
      if (intentTemplateSearchCriteria.intentId) {
        whereClause.intentId = intentTemplateSearchCriteria.intentId;
      }
      if (intentTemplateSearchCriteria.templateId) {
        whereClause.templateId = intentTemplateSearchCriteria.templateId;
      }
      if (intentTemplateSearchCriteria.assignedToOrgId) {
        whereClause.orgId = intentTemplateSearchCriteria.assignedToOrgId;
      }
      if (intentTemplateSearchCriteria.templateCreatedByOrgId) {
        whereClause.template = { is: { orgId: intentTemplateSearchCriteria.templateCreatedByOrgId } };
      }

      if (intentTemplateSearchCriteria.intent) {
        whereClause.intent = { is: { name: intentTemplateSearchCriteria.intent } };
      }

      if (intentTemplateSearchCriteria.searchByText) {
        const search = intentTemplateSearchCriteria.searchByText;
        whereClause.OR = [
          { intent: { is: { name: { contains: search, mode: 'insensitive' } } } },
          { template: { is: { name: { contains: search, mode: 'insensitive' } } } }
        ];
      }

      const orderByField = intentTemplateSearchCriteria.sortField || 'createDateTime';
      const orderDirection = SortValue.ASC === intentTemplateSearchCriteria.sortBy ? 'asc' : 'desc';

      const intentTemplates = await this.prisma.intent_templates.findMany({
        where: whereClause,
        select: {
          id: true,
          createDateTime: true,
          createdBy: true,
          intentId: true,
          templateId: true,
          orgId: true,
          intent: { select: { name: true } },
          template: { select: { name: true, orgId: true, organisation: { select: { name: true } } } },
          organisation: { select: { name: true } }
        },
        orderBy: {
          [orderByField]: orderDirection
        },
        take: pageSize,
        skip: (pageNumber - 1) * pageSize
      });

      const totalItems = await this.prisma.intent_templates.count({ where: whereClause });

      const data = intentTemplates.map((it) => ({
        id: it.id,
        createDateTime: it.createDateTime,
        createdBy: it.createdBy,
        intentId: it.intentId,
        templateId: it.templateId,
        intent: it.intent?.name,
        templateName: it.template?.name,
        template: it.template?.name,
        assignedToOrg: it.organisation?.name,
        templateCreatedByOrg: it.template?.organisation?.name
      }));

      const hasNextPage = pageSize * pageNumber < totalItems;
      const hasPreviousPage = 1 < pageNumber;

      return {
        totalItems,
        hasNextPage,
        hasPreviousPage,
        nextPage: Number(pageNumber) + 1,
        previousPage: pageNumber - 1,
        lastPage: Math.ceil(totalItems / pageSize),
        data
      };
    } catch (error) {
      this.logger.error(`[getAllIntentTemplateByQuery] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }
}
