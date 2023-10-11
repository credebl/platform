import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '@credebl/prisma-service';
// eslint-disable-next-line camelcase
import { ecosystem, ecosystem_invitations, ecosystem_orgs, endorsement_transaction, org_agents, platform_config } from '@prisma/client';
import { EcosystemInvitationStatus, EcosystemOrgStatus, EcosystemRoles, endorsementTransactionStatus } from '../enums/ecosystem.enum';
import { SchemaTransactionResponse } from '../interfaces/ecosystem.interfaces';
import { ResponseMessages } from '@credebl/common/response-messages';
import { NotFoundException } from '@nestjs/common';
// eslint-disable-next-line camelcase

@Injectable()
export class EcosystemRepository {

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger
  ) { }

  /**
   * Description: Get getAgentEndPoint by orgId
   * @param createEcosystemDto 
   * @returns Get getAgentEndPoint details
   */
  // eslint-disable-next-line camelcase
  async createNewEcosystem(createEcosystemDto): Promise<ecosystem> {
    try {
      const transaction = await this.prisma.$transaction(async (prisma) => {
        const { name, description, userId, logo, tags, orgId, orgName, orgDid } = createEcosystemDto;
        const createdEcosystem = await prisma.ecosystem.create({
          data: {
            name,
            description,
            tags,
            logoUrl: logo,
            createdBy: orgId,
            lastChangedBy: orgId
          }
        });
        let ecosystemUser;
        if (createdEcosystem) {
          ecosystemUser = await prisma.ecosystem_users.create({
            data: {
              userId: String(userId),
              ecosystemId: createdEcosystem.id,
              createdBy: orgId,
              lastChangedBy: orgId
            }
          });
        }

        if (ecosystemUser) {
          const ecosystemRoleDetails = await this.prisma.ecosystem_roles.findFirst({
            where: {
              name: EcosystemRoles.ECOSYSTEM_LEAD
            }
          });
          ecosystemUser = await prisma.ecosystem_orgs.create({
            data: {
              orgId: String(orgId),
              status: EcosystemOrgStatus.ACTIVE,
              ecosystemId: createdEcosystem.id,
              ecosystemRoleId: ecosystemRoleDetails.id,
              createdBy: orgId,
              lastChangedBy: orgId
            }
          });
        }
        return createdEcosystem;
      });

      return transaction;
    } catch (error) {
      this.logger.error(`Error in create ecosystem transaction: ${error.message}`);
      throw error;
    }
  }

  /**
 * Description: Edit ecosystem by Id
 * @param editEcosystemDto 
 * @returns ecosystem details
 */
  // eslint-disable-next-line camelcase
  async updateEcosystemById(createEcosystemDto, ecosystemId): Promise<ecosystem> {
    try {
      const { name, description, tags, logo } = createEcosystemDto;
      const editEcosystem = await this.prisma.ecosystem.update({
        where: { id: ecosystemId },
        data: {
          name,
          description,
          tags,
          logoUrl: logo
        }
      });
      return editEcosystem;
    } catch (error) {
      this.logger.error(`Error in edit ecosystem transaction: ${error.message}`);
      throw error;
    }
  }

  /**
 * 
 *
 * @returns Get all ecosystem details
 */
  // eslint-disable-next-line camelcase
  async getAllEcosystemDetails(): Promise<ecosystem[]> {
    try {
      const ecosystemDetails = await this.prisma.ecosystem.findMany({
      });
      return ecosystemDetails;
    } catch (error) {
      this.logger.error(`Error in get all ecosystem transaction: ${error.message}`);
      throw error;
    }
  }

  async getEcosystemInvitationsPagination(queryObject: object, status: string, pageNumber: number, pageSize: number): Promise<object> {
    try {
      const result = await this.prisma.$transaction([
        this.prisma.ecosystem_invitations.findMany({
          where: {
            ...queryObject,
            status
          },
          include: {
            ecosystem: true
          },
          take: pageSize,
          skip: (pageNumber - 1) * pageSize,
          orderBy: {
            createDateTime: 'desc'
          }
        }),
        this.prisma.ecosystem_invitations.count({
          where: {
            ...queryObject
          }
        })
      ]);

      const [invitations, totalCount] = result;
      const totalPages = Math.ceil(totalCount / pageSize);

      return { totalPages, invitations };

    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  /**
   * 
   * @param ecosystemId 
   * @returns Get specific ecosystem details
   */
  async getEcosystemDetails(ecosystemId: string): Promise<ecosystem> {
    try {
      return this.prisma.ecosystem.findFirst({
        where: {
          id: ecosystemId
        }
      });
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  /**
   * 
   * @returns Get ecosystem dashboard card count
   */

  async getEcosystemDashboardDetails(ecosystemId: string): Promise<object> {
    try {
      const membersCount = await this.getEcosystemMembersCount(ecosystemId);
      const endorsementsCount = await this.getEcosystemEndorsementsCount(ecosystemId);
      return {
        membersCount,
        endorsementsCount
      };
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }  
  }


  async getEcosystemMembersCount (ecosystemId: string): Promise<number> {
    try {
      const membersCount = await this.prisma.ecosystem_orgs.count(
        {
          where: {
            ecosystemId
          }
        }
      );
      return membersCount;    
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  async getEcosystemEndorsementsCount (ecosystemId: string): Promise<number> {
    try {
      const endorsementsCount = await this.prisma.endorsement_transaction.count({
        where: {
          ecosystemOrgs: {
            ecosystemId
    
          }
        }
      });
      return endorsementsCount;        
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  /**
   * 
   * @param queryObject 
   * @returns Get all ecosystem invitations
   */
  async getEcosystemInvitations(
    queryObject: object
    // eslint-disable-next-line camelcase
  ): Promise<ecosystem_invitations[]> {
    try {
      return this.prisma.ecosystem_invitations.findMany({
        where: {
          ...queryObject
        },
        include: {
          ecosystem: true
        }
      });
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  /**
   * 
   * @param email 
   * @param ecosystemId 
   * @param userId 
   * @returns 
   */
  async createSendInvitation(
    email: string,
    ecosystemId: string,
    userId: string
    // eslint-disable-next-line camelcase
  ): Promise<ecosystem_invitations> {
    try {
      return this.prisma.ecosystem_invitations.create({
        data: {
          email,
          userId,
          ecosystem: { connect: { id: ecosystemId } },
          status: EcosystemInvitationStatus.PENDING,
          orgId: ''
        }
      });
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

    async getEcosystemInvitationsPagination(queryObject: object, status: string, pageNumber: number, pageSize: number): Promise<object> {
        try {
          const result = await this.prisma.$transaction([
            this.prisma.ecosystem_invitations.findMany({
              where: {
                ...queryObject,
                status
              },
              include: {
                ecosystem: true
              },
              take: pageSize,
              skip: (pageNumber - 1) * pageSize,
              orderBy: {
                createDateTime: 'desc'
              }
            }),
            this.prisma.ecosystem_invitations.count({
              where: {
                ...queryObject
              }
            })
          ]);
    
          const [invitations, totalCount] = result;
          const totalPages = Math.ceil(totalCount / pageSize);
    
          return { totalPages, invitations };
        } catch (error) {
          this.logger.error(`error: ${JSON.stringify(error)}`);
          throw new InternalServerErrorException(error);
        }
      }

    async getEcosystemInvitations(userEmail: string, status: string, pageNumber: number, pageSize: number, search = ''): Promise<object> {
        try {
          const query = {
            AND: [
              { email: userEmail },
              { status: { contains: search, mode: 'insensitive' } }
            ]
          };

          return this.getEcosystemInvitationsPagination(query, status, pageNumber, pageSize);
        } catch (error) {
          this.logger.error(`error: ${JSON.stringify(error)}`);
          throw new InternalServerErrorException(error);
        }
      }
}
