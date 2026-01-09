/* eslint-disable camelcase */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { EcosystemOrgStatus, EcosystemRoles, Invitation } from '@credebl/enum/enum';
import { ICreateEcosystem, IEcosystemDashboard } from '../interfaces/ecosystem.interfaces';
// eslint-disable-next-line camelcase
import { ecosystem, ecosystem_invitations, ecosystem_orgs } from '@prisma/client';

import { PrismaService } from '@credebl/prisma-service';
import { ResponseMessages } from '@credebl/common/response-messages';

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
    invitedUserId: string | null;
    platformAdminId: string;
  }): Promise<ecosystem_invitations> {
    const { email, invitedUserId, platformAdminId } = payload;

    return this.prisma.ecosystem_invitations.create({
      data: {
        email,
        // Change to PENDING when accept/reject flow is ready
        status: Invitation.ACCEPTED,

        // invited user (nullable)
        userId: invitedUserId,

        // platform admin
        createdBy: platformAdminId,
        lastChangedBy: platformAdminId
      }
    });
  }

  async getInvitationsByUserId(userId: string): Promise<ecosystem_invitations[]> {
    return this.prisma.ecosystem_invitations.findMany({
      where: {
        createdBy: userId
      },
      orderBy: {
        createDateTime: 'desc'
      }
    });
  }

  /**
   * Description: create ecosystem
   * @param createEcosystemDto
   * @returns ecosystem
   */
  // eslint-disable-next-line camelcase
  async createNewEcosystem(createEcosystemDto: ICreateEcosystem): Promise<ecosystem> {
    try {
      const transaction = await this.prisma.$transaction(async (prisma) => {
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
          }
        });
        let ecosystemUser;
        if (createdEcosystem) {
          ecosystemUser = await prisma.ecosystem_users.create({
            data: {
              userId: String(userId),
              ecosystemId: createdEcosystem.id,
              createdBy: userId,
              lastChangedBy: userId
            }
          });
        }

        if (ecosystemUser) {
          const ecosystemRoleDetails = await prisma.ecosystem_roles.findFirst({
            where: {
              name: EcosystemRoles.ECOSYSTEM_LEAD
            }
          });
          if (!ecosystemRoleDetails) {
            throw new NotFoundException(ResponseMessages.ecosystem.error.leadNotFound);
          }
          ecosystemUser = await prisma.ecosystem_orgs.create({
            data: {
              orgId: String(orgId),
              status: EcosystemOrgStatus.ACTIVE,
              ecosystemId: createdEcosystem.id,
              ecosystemRoleId: ecosystemRoleDetails.id,
              createdBy: userId,
              lastChangedBy: userId
            }
          });
        }
        return createdEcosystem;
      });

      // To return selective object data
      delete transaction.lastChangedDateTime;
      delete transaction.lastChangedBy;
      delete transaction.deletedAt;

      return transaction;
    } catch (error) {
      this.logger.error(`Error in create ecosystem transaction: ${error.message}`);
      throw error;
    }
  }
  async checkEcosystemNameExist(name: string): Promise<ecosystem> {
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

    const ecosystem = await this.prisma.ecosystem.findFirst({
      where: {
        createdBy: userId,
        deletedAt: null
      },
      select: { id: true }
    });

    return Boolean(ecosystem);
  }

  async findAcceptedInvitationByUserId(userId: string): Promise<ecosystem_invitations | null> {
    if (!userId) {
      throw new BadRequestException('userId missing');
    }

    return this.prisma.ecosystem_invitations.findFirst({
      where: {
        userId,
        status: Invitation.ACCEPTED,
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
          logoUrl: ecosystem.logoUrl,
          ledgers: ecosystem.ledgers as string[]
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
}
