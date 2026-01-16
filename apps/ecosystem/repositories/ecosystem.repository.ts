import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { EcosystemOrgStatus, EcosystemRoles, Invitation, InviteType, SortValue } from '@credebl/enum/enum';
import {
  ICreateEcosystem,
  IEcosystem,
  IEcosystemDashboard,
  IEcosystemInvitation,
  IEcosystemOrg,
  IGetAllOrgs,
  PrismaExecutor
} from '../interfaces/ecosystem.interfaces';
import {
  IIntentTemplateList,
  IIntentTemplateSearchCriteria
} from '@credebl/common/interfaces/intents-template.interface';
/* eslint-disable camelcase */
// eslint-disable-next-line camelcase
import {
  Prisma,
  ecosystem,
  ecosystem_invitations,
  ecosystem_orgs,
  ecosystem_roles,
  intent_templates,
  intents,
  user,
  verification_templates
} from '@prisma/client';

import { OrgRoles } from 'libs/org-roles/enums';
import { PrismaService } from '@credebl/prisma-service';
import { ResponseMessages } from '@credebl/common/response-messages';

// eslint-disable-next-line camelcase

@Injectable()
export class EcosystemRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger
  ) {}

  /**
   *
   * @body sendInvitationDto
   * @returns orgInvitaionDetails
   */
  async createEcosystemInvitation(payload: {
    email: string;
    invitedUserId?: string;
    userId: string;
    type?: InviteType;
    status?: Invitation;
    ecosystemId?: string;
    orgId?: string;
    // eslint-disable-next-line camelcase
  }): Promise<ecosystem_invitations> {
    try {
      const { email, invitedUserId, userId, type, status, ecosystemId, orgId } = payload;

      return await this.prisma.ecosystem_invitations.create({
        data: {
          email,
          status: status || Invitation.ACCEPTED,
          userId: invitedUserId,
          ecosystemId,
          createdBy: userId,
          lastChangedBy: userId,
          type: type || InviteType.ECOSYSTEM,
          invitedOrg: orgId
        }
      });
    } catch (error) {
      this.logger.error('createEcosystemInvitation error', error);
      throw new InternalServerErrorException(ResponseMessages.ecosystem.error.invitationCreateFailed);
    }
  }

  async getInvitationsByUserId(
    userId: string
    // eslint-disable-next-line camelcase
  ): Promise<ecosystem_invitations[]> {
    try {
      return await this.prisma.ecosystem_invitations.findMany({
        where: {
          createdBy: userId
        },
        orderBy: {
          createDateTime: 'desc'
        }
      });
    } catch (error) {
      this.logger.error('getInvitationsByUserId error', error);
      throw new InternalServerErrorException(ResponseMessages.ecosystem.error.fetchInvitationsFailed);
    }
  }

  /**
   * Description: create ecosystem
   * @param createEcosystemDto
   * @returns ecosystem
   */
  // eslint-disable-next-line camelcase
  async createNewEcosystem(
    createEcosystemDto: ICreateEcosystem,
    prisma: PrismaExecutor = this.prisma
  ): Promise<IEcosystem> {
    try {
      const { name, description, userId, logo, tags, orgId, autoEndorsement } = createEcosystemDto;
      const createdEcosystem = await prisma.ecosystem.create({
        data: {
          name,
          description,
          tags,
          autoEndorsement,
          logoUrl: logo,
          createdBy: userId,
          lastChangedBy: userId
        },
        select: {
          id: true,
          name: true,
          description: true,
          tags: true,
          autoEndorsement: true,
          logoUrl: true,
          createdBy: true,
          createDateTime: true
        }
      });

      const ecosystemRoleDetails = await prisma.ecosystem_roles.findFirst({
        where: { name: EcosystemRoles.ECOSYSTEM_LEAD }
      });

      if (!ecosystemRoleDetails) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.leadNotFound);
      }
      await prisma.ecosystem_orgs.create({
        data: {
          orgId: String(orgId),
          status: EcosystemOrgStatus.ACTIVE,
          ecosystemId: createdEcosystem.id,
          ecosystemRoleId: ecosystemRoleDetails.id,
          userId: String(userId),
          createdBy: userId,
          lastChangedBy: userId
        }
      });
      return createdEcosystem;
    } catch (error) {
      this.logger.error(`Error in create ecosystem transaction: ${error.message}`);
      throw error;
    }
  }

  async checkEcosystemNameExist(name: string): Promise<ecosystem | null> {
    try {
      const checkEcosystemExists = await this.prisma.ecosystem.findFirst({
        where: {
          name
        }
      });
      return checkEcosystemExists;
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  async checkEcosystemCreatedByUser(userId: string): Promise<boolean> {
    if (!userId) {
      throw new BadRequestException('userId missing');
    }

    try {
      const ecosystem = await this.prisma.ecosystem.findFirst({
        where: {
          createdBy: userId,
          deletedAt: null
        },
        select: { id: true }
      });

      return Boolean(ecosystem);
    } catch (error) {
      this.logger.error('checkEcosystemCreatedByUser error', error);
      throw new InternalServerErrorException(ResponseMessages.ecosystem.error.checkFailed);
    }
  }

  async findAcceptedInvitationByUserId(
    userId: string
    // eslint-disable-next-line camelcase
  ): Promise<ecosystem_invitations | null> {
    if (!userId) {
      throw new BadRequestException('userId missing');
    }

    try {
      return await this.prisma.ecosystem_invitations.findFirst({
        where: {
          userId,
          status: Invitation.ACCEPTED,
          deletedAt: null
        },
        orderBy: {
          createDateTime: 'desc'
        }
      });
    } catch (error) {
      this.logger.error('findAcceptedInvitationByUserId error', error);
      throw new InternalServerErrorException(ResponseMessages.ecosystem.error.invitationFetchFailed);
    }
  }

  // eslint-disable-next-line camelcase
  async findEcosystemInvitationByEmail(email: string): Promise<ecosystem_invitations | null> {
    if (!email) {
      throw new BadRequestException('email missing');
    }

    return this.prisma.ecosystem_invitations.findFirst({
      where: {
        email,
        deletedAt: null
      },
      orderBy: {
        createDateTime: 'desc'
      }
    });
  }

  /**
   *
   * @param orgId
   * @returns Get specific organization details from ecosystem
   */
  // eslint-disable-next-line camelcase
  async checkEcosystemOrgs(orgId: string): Promise<ecosystem_orgs[]> {
    try {
      if (!orgId) {
        throw new BadRequestException(ResponseMessages.ecosystem.error.invalidOrgId);
      }
      return this.prisma.ecosystem_orgs.findMany({
        where: {
          orgId
        },
        include: {
          ecosystemRole: true
        }
      });
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getAllEcosystems(): Promise<ecosystem[]> {
    try {
      return await this.prisma.ecosystem.findMany({
        where: {
          deletedAt: null
        },
        orderBy: {
          createDateTime: 'desc'
        },
        include: {
          ecosystemOrgs: {
            include: {
              ecosystemRole: true,
              organisation: {
                select: {
                  id: true,
                  name: true,
                  orgSlug: true,
                  logoUrl: true
                }
              }
            }
          }
        }
      });
    } catch (error) {
      this.logger.error(`getAllEcosystems error: ${error.message}`);
      throw error;
    }
  }
  async getUserById(userId: string): Promise<user> {
    try {
      return this.prisma.user.findUnique({
        where: {
          id: userId
        }
      });
    } catch (error) {
      this.logger.error(`Error in getUserById: ${error.message}`);
      throw error;
    }
  }

  async getEcosystemInvitationsByEmail(email: string, ecosystemId: string): Promise<ecosystem_invitations> {
    try {
      return this.prisma.ecosystem_invitations.findUnique({
        where: {
          email_ecosystemId: {
            email,
            ecosystemId
          }
        }
      });
    } catch (error) {
      this.logger.error(`Error in getEcosystemInvitationsByEmail: ${error.message}`);
      throw error;
    }
  }

  async updateEcosystemInvitationStatusByEmail(
    email: string,
    ecosystemId: string,
    status: Invitation
  ): Promise<ecosystem_invitations> {
    try {
      return this.prisma.ecosystem_invitations.update({
        where: {
          email_ecosystemId: {
            email,
            ecosystemId
          }
        },
        data: {
          status
        }
      });
    } catch (error) {
      this.logger.error(`Error in updateEcosystemInvitationStatusByEmail: ${error.message}`);
      throw error;
    }
  }

  async getEcosystemOrgDetailsByUserId(
    userId: string,
    ecosystemId: string
  ): Promise<{ ecosystemRole: { name: string } }[]> {
    try {
      return this.prisma.ecosystem_orgs.findMany({
        where: {
          createdBy: userId,
          ecosystemId
        },
        select: {
          ecosystemRole: {
            select: {
              name: true
            }
          }
        }
      });
    } catch (error) {
      this.logger.error(`Error in getEcosystemDetailsByOrgId: ${error.message}`);
      throw error;
    }
  }

  async getEcosystemDetailsByUserId(userId: string): Promise<ecosystem> {
    try {
      return this.prisma.ecosystem.findFirst({
        where: {
          createdBy: userId
        }
      });
    } catch (error) {
      this.logger.error(`Error in getEcosystemDetailsByOrgId: ${error.message}`);
    }
  }

  async getUserByKeycloakId(keycloakId: string): Promise<user> {
    try {
      return this.prisma.user.findFirst({
        where: {
          keycloakUserId: keycloakId
        }
      });
    } catch (error) {
      this.logger.error(`Error in getEcosystemDetailsByOrgId: ${error.message}`);
    }
  }

  async getEcosystemDashboard(ecosystemId: string, orgId: string): Promise<IEcosystemDashboard> {
    const ecosystem = await this.prisma.ecosystem.findFirst({
      where: {
        id: ecosystemId,
        deletedAt: null,
        ecosystemOrgs: {
          some: { orgId, deletedAt: null }
        }
      },
      include: {
        ecosystemOrgs: {
          where: { orgId, deletedAt: null },
          include: {
            ecosystemRole: true,
            organisation: {
              select: {
                id: true,
                name: true,
                orgSlug: true,
                logoUrl: true
              }
            }
          }
        }
      }
    });

    if (!ecosystem) {
      throw new NotFoundException(ResponseMessages.ecosystem.error.notFound);
    }

    const ecosystemLeadOrg = ecosystem.ecosystemOrgs?.length ? ecosystem.ecosystemOrgs[0] : null;

    return {
      ecosystem: [
        {
          id: ecosystem.id,
          name: ecosystem.name,
          description: ecosystem.description,
          tags: ecosystem.tags,
          createDateTime: ecosystem.createDateTime,
          createdBy: ecosystem.createdBy,
          lastChangedDateTime: ecosystem.lastChangedDateTime,
          lastChangedBy: ecosystem.lastChangedBy,
          deletedAt: ecosystem.deletedAt,
          logoUrl: ecosystem.logoUrl
        }
      ],
      membersCount: 0,
      endorsementsCount: 0,
      ecosystemLead: ecosystemLeadOrg
        ? {
            role: ecosystemLeadOrg.ecosystemRole?.name ?? null,
            orgName: ecosystemLeadOrg.organisation?.name ?? null
          }
        : null
    };
  }

  async createEcosystemOrg(ecosystemUser: IEcosystemOrg): Promise<ecosystem_orgs> {
    try {
      return await this.prisma.ecosystem_orgs.create({
        data: ecosystemUser
      });
    } catch (error) {
      this.logger.error(`Error in createEcosystemUser: ${error.message}`);
    }
  }

  // async getEcosystemOrg(ecosystemId: string, userId: string): Promise<ecosystem_users> {
  //   try {
  //     return await this.prisma.ecosystem_users.findFirst({
  //       where: {
  //         userId,
  //         ecosystemId
  //       }
  //     });
  //   } catch (error) {
  //     this.logger.error(`Error in getEcosystemUser: ${error.message}`);
  //   }
  // }

  async getEcosystemOrg(ecosystemId: string, orgId: string): Promise<ecosystem_orgs> {
    try {
      return await this.prisma.ecosystem_orgs.findFirst({
        where: {
          orgId,
          ecosystemId
        }
      });
    } catch (error) {
      this.logger.error(`Error in getEcosystemOrg: ${error.message}`);
    }
  }

  async deleteOrgFromEcosystem(
    ecosystemId: string,
    orgIds: string[],
    prisma: PrismaExecutor = this.prisma
  ): Promise<{ count: number }> {
    try {
      const result = await prisma.ecosystem_orgs.deleteMany({
        where: {
          ecosystemId,
          ecosystemRole: {
            name: OrgRoles.ECOSYSTEM_MEMBER
          },
          orgId: {
            in: orgIds
          }
        }
      });
      return result;
    } catch (error) {
      this.logger.error(`Error in deleteOrgFromEcosystem: ${error.message}`);
      throw error;
    }
  }

  async deleteEcosystemInvitationByOrgId(
    ecosystemId: string,
    orgId: string[],
    prisma: PrismaExecutor = this.prisma
  ): Promise<{ count: number }> {
    try {
      const result = await prisma.ecosystem_invitations.deleteMany({
        where: {
          ecosystemId,
          type: InviteType.MEMBER,
          invitedOrg: {
            in: orgId
          }
        }
      });
      return result;
    } catch (error) {
      this.logger.error(`Error in deleteEcosystemInvitationByUserId: ${error.message}`);
      throw error;
    }
  }

  async updateEcosystemOrgStatus(
    ecosystemId: string,
    orgId: string[],
    status: EcosystemOrgStatus
  ): Promise<{ count: number }> {
    try {
      const result = await this.prisma.ecosystem_orgs.updateMany({
        where: {
          ecosystemId,
          orgId: {
            in: orgId
          }
        },
        data: {
          status
        }
      });
      return result;
    } catch (error) {
      this.logger.error(`Error in updateEcosystemUserStatus: ${error.message}`);
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

  async getAllEcosystemOrgsByEcosystemId(ecosystemId: string): Promise<IGetAllOrgs[]> {
    try {
      const result = await this.prisma.ecosystem_orgs.findMany({
        where: {
          ecosystemId
        },
        select: {
          id: true,
          status: true,
          userId: true,
          ecosystemRole: {
            select: {
              id: true,
              name: true
            }
          },

          ecosystem: {
            select: {
              id: true,
              name: true,
              description: true,
              tags: true,
              createDateTime: true,
              createdBy: true,
              logoUrl: true,
              autoEndorsement: true,
              ledgers: true
            }
          },

          organisation: {
            select: {
              id: true,
              createDateTime: true,
              createdBy: true,
              name: true,
              description: true,
              orgSlug: true
            }
          },

          user: {
            select: {
              id: true,
              createDateTime: true,
              lastChangedDateTime: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true
            }
          }
        }
      });
      return result;
    } catch (error) {
      this.logger.error(`Error in getAllEcosystemOrgsByEcosystemId: ${error.message}`);
      throw error;
    }
  }

  async getEcosystemRoleByName(name: string): Promise<ecosystem_roles> {
    try {
      const result = await this.prisma.ecosystem_roles.findFirst({
        where: { name }
      });
      return result;
    } catch (error) {
      this.logger.error(`Error in getEcosystemRoleByName: ${error.message}`);
      throw error;
    }
  }

  async updateEcosystemInvitationDetails(
    email: string,
    ecosystemId: string,
    orgId: string,
    prisma: PrismaExecutor = this.prisma
  ): Promise<ecosystem_invitations> {
    try {
      const invitation = await prisma.ecosystem_invitations.findFirst({
        where: {
          email,
          ecosystemId: null
        },
        orderBy: {
          createDateTime: 'desc'
        }
      });
      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }

      return prisma.ecosystem_invitations.update({
        where: {
          id: invitation.id
        },
        data: {
          ecosystemId,
          invitedOrg: orgId
        }
      });
    } catch (error) {
      this.logger.error(`Error in updateEcosystemInvitationDetails: ${error.message}`);
      throw error;
    }
  }

  async getPendingInvitationByEmail(email: string): Promise<ecosystem_invitations> {
    try {
      const invitation = await this.prisma.ecosystem_invitations.findFirst({
        where: {
          email,
          ecosystemId: null
        },
        orderBy: {
          createDateTime: 'desc'
        }
      });
      return invitation;
    } catch (error) {
      this.logger.error(`Error in getPendingInvitationByEmail: ${error.message}`);
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
  /**
   * Create a new intent
   */
  async createIntent(data: {
    name: string;
    description?: string;
    createdBy: string;
    ecosystemId: string;
  }): Promise<intents> {
    try {
      if (!data.name || !data.createdBy) {
        throw new BadRequestException('Intent name and createdBy are required');
      }
      if (!data.ecosystemId) {
        throw new BadRequestException('ecosystemId is required');
      }

      const intent = await this.prisma.intents.create({
        data: {
          name: data.name,
          description: data.description,
          createdBy: data.createdBy,
          lastChangedBy: data.createdBy,
          ecosystemId: data.ecosystemId
        }
      });

      this.logger.log(`[createIntent] - Intent created with id ${intent.id}`);
      return intent;
    } catch (error) {
      this.logger.error('[createIntent] error', error);
      throw error;
    }
  }

  async getEcosystemInvitations(params: {
    role: OrgRoles.ECOSYSTEM_LEAD | OrgRoles.ECOSYSTEM_MEMBER;
    ecosystemId?: string;
    email?: string;
    userId?: string;
  }): Promise<IEcosystemInvitation[]> {
    const { role, ecosystemId, email, userId } = params;

    let where: Prisma.ecosystem_invitationsWhereInput = {
      deletedAt: null,
      type: InviteType.MEMBER
    };

    // Lead
    if (OrgRoles.ECOSYSTEM_LEAD === role) {
      if (!ecosystemId) {
        throw new Error('ecosystemId is required for LEAD');
      }

      where.ecosystemId = ecosystemId;
    }

    // Member
    if (OrgRoles.ECOSYSTEM_MEMBER === role) {
      where = {
        ...where,
        status: Invitation.PENDING,
        OR: [email ? { email } : undefined, userId ? { userId } : undefined].filter(Boolean)
      };
    }

    return this.prisma.ecosystem_invitations.findMany({
      where,
      orderBy: {
        createDateTime: 'desc'
      },
      select: {
        id: true,
        email: true,
        status: true,
        type: true,
        ecosystemId: true,
        invitedOrg: true,
        createDateTime: true,

        ecosystem: {
          select: {
            id: true,
            name: true,
            description: true,
            logoUrl: true,
            autoEndorsement: true
          }
        },

        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            username: true,
            profileImg: true
          }
        }
      }
    });
  }
  /**
   * Get all intents
   */
  async getIntents(ecosystemId: string, intentId?: string): Promise<intents[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      ecosystemId // ✅ ALWAYS applied
    };

    if (intentId) {
      where.id = intentId; // ✅ ensures intent belongs to ecosystem
    }

    return this.prisma.intents.findMany({
      where,
      orderBy: { createDateTime: 'desc' }
    });
  }

  // eslint-disable-next-line camelcase
  async getTemplatesByEcosystemId(ecosystemId: string): Promise<verification_templates[]> {
    try {
      return await this.prisma.verification_templates.findMany({
        where: {
          organisation: {
            ecosystemOrgs: {
              some: {
                ecosystemId,
                deletedAt: null
              }
            }
          }
        },
        include: {
          organisation: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createDateTime: 'desc'
        }
      });
    } catch (error) {
      this.logger.error('[getTemplatesByEcosystemId] error', error);
      throw error;
    }
  }

  /**
   * Update an intent
   */
  async updateIntent(data: {
    intentId: string;
    name?: string;
    description?: string;
    lastChangedBy: string;
  }): Promise<intents> {
    try {
      if (!data.intentId || !data.lastChangedBy) {
        throw new BadRequestException('Intent id and lastChangedBy are required');
      }

      const intent = await this.prisma.intents.update({
        where: { id: data.intentId },
        data: {
          name: data.name,
          description: data.description,
          lastChangedBy: data.lastChangedBy,
          lastChangedDateTime: new Date()
        }
      });

      this.logger.log(`[updateIntent] - Intent updated with id ${intent.id}`);
      return intent;
    } catch (error) {
      this.logger.error('[updateIntent] error', error);
      throw error;
    }
  }

  async deleteIntent(data: { ecosystemId: string; intentId: string }): Promise<intents> {
    const intent = await this.prisma.intents.findFirst({
      where: {
        id: data.intentId,
        ecosystemId: data.ecosystemId
      }
    });

    if (!intent) {
      throw new NotFoundException('Intent not found in the given ecosystem');
    }

    await this.prisma.intents.deleteMany({
      where: {
        id: data.intentId,
        ecosystemId: data.ecosystemId
      }
    });

    return intent;
  }
}
