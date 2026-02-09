/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { EcosystemOrgStatus, EcosystemRoles, Invitation, InviteType, SortValue } from '@credebl/enum/enum';
import {
  ICreateEcosystem,
  ICreateEcosystemOrg,
  IEcosystem,
  IEcosystemDashboard,
  IEcosystemInvitation,
  IGetAllOrgs,
  PrismaExecutor
} from '../interfaces/ecosystem.interfaces';
import {
  IIntentTemplateList,
  IIntentTemplateSearchCriteria
} from '@credebl/common/interfaces/intents-template.interface';
import { IPaginationSortingDto, PaginatedResponse } from 'libs/common/src/interfaces/interface';
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
  platform_config,
  user,
  verification_templates
} from '@prisma/client';

import { OrgRoles } from 'libs/org-roles/enums';
import { PrismaService } from '@credebl/prisma-service';
import { ResponseMessages } from '@credebl/common/response-messages';
import { RpcException } from '@nestjs/microservices';

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
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if ('P2002' === error.code) {
          throw new RpcException({
            status: HttpStatus.CONFLICT,
            message: 'Invitation already exists for this email in the ecosystem'
          });
        }
      }
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
        include: {
          ecosystem: {
            select: {
              id: true,
              name: true,
              description: true,
              createDateTime: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          organisation: {
            select: {
              name: true
            }
          }
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

      const ecosystemRoleDetails = await prisma.ecosystem_roles.findFirst({
        where: { name: EcosystemRoles.ECOSYSTEM_LEAD }
      });

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
    } catch (error: any) {
      this.logger.error(`Error in create ecosystem transaction: ${error}`);
      throw error;
    }
  }

  async checkEcosystemNameExist(name?: string): Promise<ecosystem | null> {
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

  async getAllEcosystems(pageDetail: IPaginationSortingDto): Promise<PaginatedResponse<ecosystem>> {
    try {
      const whereClause = {
        deletedAt: null
      };
      const result = await this.prisma.$transaction([
        this.prisma.ecosystem.findMany({
          where: whereClause,
          orderBy: {
            [pageDetail.sortField || 'createDateTime']: SortValue.ASC === pageDetail.sortBy ? 'asc' : 'desc'
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
          },
          take: pageDetail.pageSize,
          skip: (pageDetail.pageNumber - 1) * pageDetail.pageSize
        }),
        this.prisma.ecosystem.count({
          where: whereClause
        })
      ]);
      const [data, totalCount] = result;
      const totalPages = Math.ceil(totalCount / pageDetail.pageSize);
      return { totalPages, data };
    } catch (error) {
      this.logger.error(`getAllEcosystems error: ${error}`);
      throw error;
    }
  }
  async getUserById(userId: string): Promise<user | null> {
    try {
      const userdetails = await this.prisma.user.findUnique({
        where: {
          id: userId
        }
      });
      return userdetails;
    } catch (error) {
      this.logger.error(`Error in getUserById: ${error}`);
      throw error;
    }
  }

  async getEcosystemInvitationsByEmail(
    email: string,
    ecosystemId: string,
    invitedOrg: string
  ): Promise<ecosystem_invitations> {
    try {
      const invitation = await this.prisma.ecosystem_invitations.findUnique({
        where: {
          email_ecosystemId_invitedOrg: {
            email,
            ecosystemId,
            invitedOrg
          }
        }
      });
      return invitation;
    } catch (error) {
      this.logger.error(`Error in getEcosystemInvitationsByEmail: ${error}`);
      throw error;
    }
  }

  async updateEcosystemInvitationStatusByEmail(
    email: string,
    orgId: string,
    ecosystemId: string,
    status: Invitation
  ): Promise<ecosystem_invitations> {
    try {
      return this.prisma.$transaction(async (tx) => {
        const record = await tx.ecosystem_invitations.findFirst({
          where: {
            email,
            ecosystemId,
            invitedOrg: orgId
          }
        });

        if (!record) {
          throw new Error('Invitation not found for this specific organization');
        }

        return tx.ecosystem_invitations.update({
          where: {
            id: record.id
          },
          data: { status }
        });
      });
      return updateInvitationsBtEmail;
    } catch (error) {
      this.logger.error(`Error in updateEcosystemInvitationStatusByEmail: ${error}`);
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
      this.logger.error(`Error in getEcosystemOrgDetailsByUserId: ${error}`);
      throw error;
    }
  }

  async getEcosystemDetailsByUserId(userId: string): Promise<ecosystem | null> {
    try {
      return this.prisma.ecosystem.findFirst({
        where: {
          createdBy: userId
        }
      });
    } catch (error) {
      this.logger.error(`Error in getEcosystemDetailsByUserId: ${error}`);
      throw error;
    }
  }

  async getUserByKeycloakId(keycloakId: string): Promise<user | null> {
    try {
      return this.prisma.user.findFirst({
        where: {
          keycloakUserId: keycloakId
        }
      });
    } catch (error) {
      this.logger.error(`Error in getUserByKeycloakId: ${error}`);
      throw error;
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

    if (!orgId) {
      throw new NotFoundException(ResponseMessages.ecosystem.error.notFound);
    }

    if (!ecosystem) {
      throw new NotFoundException(ResponseMessages.ecosystem.error.ecosystemNotFound);
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

  async createEcosystemOrg(ecosystemUser: ICreateEcosystemOrg): Promise<ecosystem_orgs> {
    try {
      return await this.prisma.ecosystem_orgs.create({
        data: ecosystemUser
      });
    } catch (error) {
      this.logger.error(`Error in createEcosystemOrg: ${error}`);
      throw error;
    }
  }

  async getEcosystemOrg(ecosystemId: string, orgId: string): Promise<ecosystem_orgs | null> {
    try {
      return await this.prisma.ecosystem_orgs.findFirst({
        where: {
          orgId,
          ecosystemId
        }
      });
    } catch (error) {
      this.logger.error(`Error in getEcosystemOrg: ${error}`);
      throw error;
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
      this.logger.error(`Error in deleteOrgFromEcosystem: ${error}`);
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
      this.logger.error(`Error in deleteEcosystemInvitationByUserId: ${error}`);
      throw error;
    }
  }

  async updateEcosystemOrgStatus(
    ecosystemId: string,
    orgId: string[],
    status: EcosystemOrgStatus
  ): Promise<{ count: number }> {
    try {
      return await this.prisma.ecosystem_orgs.updateMany({
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
    } catch (error) {
      this.logger.error(`Error in updateEcosystemUserStatus: ${error}`);
      throw error;
    }
  }

  async getEcosystemById(id: string): Promise<ecosystem> {
    try {
      const result = await this.prisma.ecosystem.findFirst({
        where: { id }
      });
      if (!result) {
        throw new NotFoundException('Ecosystem not found');
      }
      return result;
    } catch (error) {
      this.logger.error(`Error in getEcosystemById: ${error}`);
      throw error;
    }
  }

  async getPlatformConfigData(): Promise<platform_config> {
    try {
      const config = await this.prisma.platform_config.findFirst();
      if (!config) {
        throw new NotFoundException('Platform config not found');
      }
      return config;
    } catch (error) {
      this.logger.error(`Error in getPlatformConfigData: ${error}`);
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
      if (!intentTemplate) {
        throw new NotFoundException('Intent template not found');
      }
      this.logger.log(`[getIntentTemplateById] - Intent template details ${id}`);
      return intentTemplate;
    } catch (error) {
      this.logger.error(`Error in getIntentTemplateById: ${error}`);
      throw error;
    }
  }

  // eslint-disable-next-line camelcase
  async getIntentTemplates(params: { intentId?: string; orgId?: string }): Promise<intent_templates[]> {
    try {
      const where: Record<string, unknown> = {};

      if (params.intentId) {
        where.intentId = params.intentId;
      }

      if (params.orgId) {
        where.orgId = params.orgId;
      }

      const intentTemplates = await this.prisma.intent_templates.findMany({
        where,
        include: {
          organisation: true,
          intent: true,
          template: true
        }
      });

      this.logger.log(
        `[getIntentTemplates] - Retrieved ${intentTemplates.length} intent templates${params.intentId ? ` for intent ${params.intentId}` : ''}${params.orgId ? ` for org ${params.orgId}` : ''}`
      );

      return intentTemplates;
    } catch (error) {
      this.logger.error('[getIntentTemplates] Error:', error);
      throw error;
    }
  }

  // Intent Template CRUD operations
  async createIntentTemplate(data: {
    orgId?: string;
    intentId: string;
    templateId: string;
    createdBy: string;
  }): Promise<intent_templates> {
    return this.prisma.intent_templates.create({
      data: {
        orgId: data.orgId ?? null,
        intentId: data.intentId,
        templateId: data.templateId,
        createdBy: data.createdBy,
        lastChangedBy: data.createdBy
      }
    });
  }

  async findIntentById(intentId: string): Promise<{ ecosystemId: string } | null> {
    return this.prisma.intents.findUnique({
      where: { id: intentId },
      select: { ecosystemId: true }
    });
  }
  async findIntentTemplate(data: {
    orgId?: string;
    intentId: string;
    templateId: string;
  }): Promise<intent_templates | null> {
    return this.prisma.intent_templates.findFirst({
      where: {
        orgId: data.orgId ?? null,
        intentId: data.intentId,
        templateId: data.templateId
      }
    });
  }

  async findEcosystemOrg(ecosystemId: string, orgId: string): Promise<ecosystem_orgs | null> {
    return this.prisma.ecosystem_orgs.findUnique({
      where: {
        orgId_ecosystemId: {
          orgId,
          ecosystemId
        }
      }
    });
  }
  // eslint-disable-next-line camelcase
  async updateIntentTemplate(
    id: string,
    data: { orgId?: string | null; intentId: string; templateId: string; lastChangedBy: string }
    // eslint-disable-next-line camelcase
  ): Promise<intent_templates> {
    try {
      const intentTemplate = await this.prisma.intent_templates.update({
        where: { id },
        data: {
          orgId: data.orgId ?? null,
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

  async getAllEcosystemOrgsByEcosystemId(
    ecosystemId: string,
    pageDetail: IPaginationSortingDto
  ): Promise<PaginatedResponse<IGetAllOrgs>> {
    try {
      const whereClause = {
        ecosystemId
      };
      const [data, count] = await this.prisma.$transaction([
        this.prisma.ecosystem_orgs.findMany({
          where: whereClause,
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
          },
          take: pageDetail.pageSize,
          skip: (pageDetail.pageNumber - 1) * pageDetail.pageSize
        }),
        this.prisma.ecosystem_orgs.count({ where: whereClause })
      ]);
      const totalPages = Math.ceil(count / pageDetail.pageSize);
      return { totalPages, data };
    } catch (error) {
      this.logger.error(`Error in getAllEcosystemOrgsByEcosystemId: ${error}`);
      throw error;
    }
  }

  async getEcosystemRoleByName(name: string): Promise<ecosystem_roles | null> {
    try {
      const result = await this.prisma.ecosystem_roles.findFirst({
        where: { name }
      });
      return result;
    } catch (error) {
      this.logger.error(`Error in getEcosystemRoleByName: ${error}`);
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
        throw new RpcException({
          status: 400,
          message: ResponseMessages.ecosystem.error.invitationRequiredFromPlatformAdmin
        });
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
    } catch (error: any) {
      this.logger.error(`Error in updateEcosystemInvitationDetails: ${error}`);
      throw error;
    }
  }

  async getPendingInvitationByEmail(email: string): Promise<ecosystem_invitations | null> {
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
      this.logger.error(`Error in getPendingInvitationByEmail: ${error}`);
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
        previousPage: hasPreviousPage ? pageNumber - 1 : 1,
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

  async getEcosystemInvitations(
    where: Prisma.ecosystem_invitationsWhereInput,
    pageDetail: IPaginationSortingDto
  ): Promise<PaginatedResponse<IEcosystemInvitation>> {
    const [data, count] = await this.prisma.$transaction([
      this.prisma.ecosystem_invitations.findMany({
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
        },
        take: pageDetail.pageSize,
        skip: (pageDetail.pageNumber - 1) * pageDetail.pageSize
      }),
      this.prisma.ecosystem_invitations.count({ where })
    ]);
    const totalPages = Math.ceil(count / pageDetail.pageSize);
    return { totalPages, data };
  }
  /**
   * Get all intents
   */
  async getIntents(
    ecosystemId: string,
    pageDetail: IPaginationSortingDto,
    intentId?: string
  ): Promise<PaginatedResponse<intents>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      ecosystemId
    };

    if (intentId) {
      where.id = intentId;
    }

    const [data, count] = await this.prisma.$transaction([
      this.prisma.intents.findMany({
        where,
        orderBy: { createDateTime: 'desc' },
        take: pageDetail.pageSize,
        skip: (pageDetail.pageNumber - 1) * pageDetail.pageSize
      }),
      this.prisma.intents.count({ where })
    ]);
    const totalPages = Math.ceil(count / pageDetail.pageSize);
    return { totalPages, data };
  }

  // eslint-disable-next-line camelcase
  async getTemplatesByOrgId(
    orgId: string,
    pageDetail: IPaginationSortingDto
  ): Promise<PaginatedResponse<verification_templates>> {
    const whereClause = {
      organisation: {
        ecosystemOrgs: {
          some: {
            orgId,
            deletedAt: null,
            status: EcosystemOrgStatus.ACTIVE // optional but recommended
          }
        }
      }
    };
    const [data, count] = await this.prisma.$transaction([
      this.prisma.verification_templates.findMany({
        where: whereClause,
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
        },
        take: pageDetail.pageSize,
        skip: (pageDetail.pageNumber - 1) * pageDetail.pageSize
      }),
      this.prisma.verification_templates.count({ where: whereClause })
    ]);
    const totalPages = Math.ceil(count / pageDetail.pageSize);
    return { totalPages, data };
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

  async deleteIntent(data: { ecosystemId: string; intentId: string; userId: string }): Promise<intents> {
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

  /**
   *   Update ecosystem enable/disable flag
   */
  async updateEcosystemConfig(payload: { isEcosystemEnabled: boolean; userId: string }): Promise<void> {
    const { isEcosystemEnabled } = payload;

    const existingConfig = await this.prisma.platform_config.findFirst();

    if (!existingConfig) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: ResponseMessages.ecosystem.error.platformConfigNotFound
      });
    }

    await this.prisma.platform_config.update({
      where: { id: existingConfig.id },
      data: {
        isEcosystemEnabled,
        lastChangedBy: payload.userId,
        lastChangedDateTime: new Date()
      }
    });
  }

  /**
   * Fetches the global platform configuration
   */
  async getPlatformConfig(): Promise<{ isEcosystemEnabled: boolean } | null> {
    return this.prisma.platform_config.findFirst({
      select: {
        isEcosystemEnabled: true
      }
    });
  }

  async getEcosystemsForEcosystemLead(
    userId: string,
    pageDetail: IPaginationSortingDto
  ): Promise<PaginatedResponse<ecosystem>> {
    const whereClause = {
      deletedAt: null,
      ecosystemOrgs: {
        some: {
          userId,
          deletedAt: null,
          ecosystemRole: {
            name: OrgRoles.ECOSYSTEM_LEAD
          }
        }
      }
    };

    const result = await this.prisma.$transaction([
      this.prisma.ecosystem.findMany({
        where: whereClause,
        orderBy: {
          [pageDetail.sortField]: SortValue.ASC === pageDetail.sortBy ? 'asc' : 'desc'
        },
        include: {
          ecosystemOrgs: {
            where: {
              userId,
              deletedAt: null
            },
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
        },
        take: pageDetail.pageSize,
        skip: (pageDetail.pageNumber - 1) * pageDetail.pageSize
      }),
      this.prisma.ecosystem.count({
        where: whereClause
      })
    ]);

    const [data, count] = result;
    const totalPages = Math.ceil(count / pageDetail.pageSize);
    return { totalPages, data };
  }

  async getEcosystemByRole(userId: string, role: string): Promise<{ ecosystemRole: { name: string } } | null> {
    try {
      return this.prisma.ecosystem_orgs.findFirst({
        where: {
          createdBy: userId,
          ecosystemRole: {
            name: role
          }
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
      this.logger.error(`Error in getEcosystemByRole: ${error.message}`);
      throw error;
    }
  }

  async getAllEcosystemsByOrgId(orgId: string): Promise<ecosystem[]> {
    try {
      if (!orgId) {
        throw new BadRequestException(ResponseMessages.ecosystem.error.invalidOrgId);
      }

      return await this.prisma.ecosystem.findMany({
        where: {
          deletedAt: null,
          ecosystemOrgs: {
            some: {
              orgId,
              deletedAt: null
            }
          }
        },
        orderBy: {
          createDateTime: 'desc'
        },
        include: {
          ecosystemOrgs: {
            where: {
              orgId,
              deletedAt: null
            },
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
    } catch (error: any) {
      this.logger.error(`getAllEcosystemsByOrgId error: ${error}`);
      throw error;
    }
  }
}
