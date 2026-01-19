import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { EcosystemOrgStatus, EcosystemRoles, Invitation, InviteType } from '@credebl/enum/enum';
import {
  ICreateEcosystem,
  IEcosystem,
  IEcosystemDashboard,
  IEcosystemInvitation,
  IEcosystemOrg,
  IGetAllOrgs,
  PrismaExecutor
} from '../interfaces/ecosystem.interfaces';
/* eslint-disable camelcase */
// eslint-disable-next-line camelcase
import {
  Prisma,
  ecosystem,
  ecosystem_invitations,
  ecosystem_orgs,
  ecosystem_roles,
  platform_config,
  user
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
      this.logger.error(`Error in getEcosystemOrgDetailsByUserId: ${error.message}`);
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
      this.logger.error(`Error in getEcosystemDetailsByUserId: ${error.message}`);
      throw error;
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
      this.logger.error(`Error in getUserByKeycloakId: ${error.message}`);
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
      this.logger.error(`Error in createEcosystemOrg: ${error.message}`);
      throw error;
    }
  }

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
      this.logger.error(`Error in updateEcosystemUserStatus: ${error.message}`);
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

  async getEcosystemById(id: string): Promise<ecosystem> {
    try {
      const result = await this.prisma.ecosystem.findFirst({
        where: { id }
      });
      return result;
    } catch (error) {
      this.logger.error(`Error in getEcosystemById: ${error.message}`);
      throw error;
    }
  }

  async getPlatformConfigData(): Promise<platform_config> {
    try {
      return await this.prisma.platform_config.findFirst();
    } catch (error) {
      this.logger.error(`Error in getPlatformConfigData: ${error.message}`);
      throw error;
    }
  }
}
