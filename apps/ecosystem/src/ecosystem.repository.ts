import { Injectable, InternalServerErrorException, Logger} from '@nestjs/common';
import { PrismaService } from '@credebl/prisma-service';
// eslint-disable-next-line camelcase
import { ecosystem, ecosystem_invitations, ecosystem_orgs, ecosystem_roles, endorsement_transaction, org_agents, platform_config } from '@prisma/client';
import { EcosystemInvitationStatus, EcosystemOrgStatus, EcosystemRoles, endorsementTransactionStatus, endorsementTransactionType } from '../enums/ecosystem.enum';
import { updateEcosystemOrgsDto } from '../dtos/update-ecosystemOrgs.dto';
import { SchemaTransactionResponse } from '../interfaces/ecosystem.interfaces';
import { ResponseMessages } from '@credebl/common/response-messages';
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
        const { name, description, userId, logo, tags, orgId } = createEcosystemDto;
        const createdEcosystem = await prisma.ecosystem.create({
          data: {
            name,
            description,
            tags,
            logoUrl: logo
          }
        });
        let ecosystemUser;
        if (createdEcosystem) {
          ecosystemUser = await prisma.ecosystem_users.create({
            data: {
              userId: String(userId),
              ecosystemId: createdEcosystem.id
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
              ecosystemRoleId: ecosystemRoleDetails.id
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
  async getAllEcosystemDetails(orgId: string): Promise<ecosystem[]> {
    try {
      const ecosystemDetails = await this.prisma.ecosystem.findMany({
        where: {
          ecosystemOrgs: {
            some: {
              orgId
            }
          }
        }
      });
      return ecosystemDetails;
    } catch (error) {
      this.logger.error(`Error in get all ecosystem transaction: ${error.message}`);
      throw error;
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
   * @param id
   * @returns Invitation details
   */
  // eslint-disable-next-line camelcase
  async getEcosystemInvitationById(id: string): Promise<ecosystem_invitations> {
    try {
      return this.prisma.ecosystem_invitations.findUnique({
        where: {
          id
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
   * @param queryObject
   * @param data
   * @returns Updated ecosystem invitation response
   */
  async updateEcosystemInvitation(id: string, data: object): Promise<object> {
    try {
      return this.prisma.ecosystem_invitations.update({
        where: {
          id: String(id)
        },
        data: {
          ...data
        }
      });
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException('Unable to update ecosystem invitation');
    }
  }

  // eslint-disable-next-line camelcase
  async getEcosystemRole(name: string): Promise<ecosystem_roles> {
    try {
      return this.prisma.ecosystem_roles.findFirst({
        where: {
          name
        }
      });
    } catch (error) {
      this.logger.error(`getEcosystemRole: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  // eslint-disable-next-line camelcase
  async updateEcosystemOrgs(createEcosystemOrgsDto: updateEcosystemOrgsDto): Promise<ecosystem_orgs> {
    try {
      const { orgId, status, ecosystemRoleId, ecosystemId } = createEcosystemOrgsDto;

      return this.prisma.ecosystem_orgs.create({
        data: {
          orgId: String(orgId),
          ecosystemId,
          status,
          ecosystemRoleId
        }
      });
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException('Unable to update ecosystem orgs');
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

  async getInvitationsByEcosystemId(ecosystemId: string, pageNumber: number, pageSize: number, search = ''): Promise<object> {
    try {
      const query = {
        ecosystemId,
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { status: { contains: search, mode: 'insensitive' } }
        ]
      };

      return await this.getEcosystemInvitationsPagination(query, pageNumber, pageSize);
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }


  /**
   * 
   * @param queryOptions 
   * @param filterOptions 
   * @returns users list
   */
  // eslint-disable-next-line camelcase
  async findEcosystemMembers(ecosystemId: string, pageNumber: number, pageSize: number, search = ''): Promise<object> {
    try {
      const query = {
        ecosystemId,
        OR:
          [{ orgId: { contains: search, mode: 'insensitive' } }]
      };
      return await this.getEcosystemMembersPagination(query, pageNumber, pageSize);
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  } 

  async getEcosystemMembersPagination(queryObject: object, pageNumber: number, pageSize: number): Promise<object> {
    try {
      const result = await this.prisma.$transaction([
        this.prisma.ecosystem_orgs.findMany({
          where: {
            ...queryObject
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
        this.prisma.ecosystem_orgs.count({
          where: {
            ...queryObject
          }
        })
      ]);

      // eslint-disable-next-line prefer-destructuring
      const members = result[0];
      // eslint-disable-next-line prefer-destructuring
      const totalCount = result[1];
      const totalPages = Math.ceil(totalCount / pageSize);

      return { totalPages, members };
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }


  async getEcosystemInvitationsPagination(queryObject: object, pageNumber: number, pageSize: number): Promise<object> {
    try {
      const result = await this.prisma.$transaction([
        this.prisma.ecosystem_invitations.findMany({
          where: {
            ...queryObject
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

      // eslint-disable-next-line prefer-destructuring
      const invitations = result[0];
      // eslint-disable-next-line prefer-destructuring
      const totalCount = result[1];
      const totalPages = Math.ceil(totalCount / pageSize);

      return { totalPages, invitations };
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }


  async fetchEcosystemOrg(
    payload: { ecosystemId: string, orgId: string }
  ): Promise<object> {

    return this.prisma.ecosystem_orgs.findFirst({
      where: {
        ...payload
      },
      select: {
        ecosystemRole: true
      }
    });

  }

  async getEndorsementsWithPagination(queryObject: object, pageNumber: number, pageSize: number): Promise<object> {
    try {
      const result = await this.prisma.$transaction([
        this.prisma.endorsement_transaction.findMany({
          where: {
            ...queryObject
          },
          select:{
            id:true,
            endorserDid: true,
            authorDid: true,
            status: true,
            type: true,
            ecosystemOrgs: true,
            requestPayload: true,
            responsePayload: true,
            createDateTime: true
          },
          take: pageSize,
          skip: (pageNumber - 1) * pageSize,
          orderBy: {
            createDateTime: 'desc'
          }
        }),
        this.prisma.endorsement_transaction.count({
          where: {
            ...queryObject
          }
        })
      ]);

      // eslint-disable-next-line prefer-destructuring
      const transactions = result[0];
      // eslint-disable-next-line prefer-destructuring
      const totalCount = result[1];
      const totalPages = Math.ceil(totalCount / pageSize);

      return { totalPages, transactions };
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

/**
* Description: Get getAgentEndPoint by orgId
* @param orgId 
* @returns Get getAgentEndPoint details
*/
  // eslint-disable-next-line camelcase
  async getAgentDetails(orgId: number): Promise<org_agents> {
    try {
      if (!orgId) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.invalidOrgId);
      }
      const agentDetails = await this.prisma.org_agents.findFirst({
        where: {
          orgId
        }
      });
      return agentDetails;

    } catch (error) {
      this.logger.error(`Error in getting getAgentEndPoint for the ecosystem: ${error.message} `);
      throw error;
    }
  }

  /**
     * Description: Get getAgentEndPoint by orgId
     * @param orgId 
     * @returns Get getAgentEndPoint details
     */
  // eslint-disable-next-line camelcase
  async getEcosystemLeadDetails(): Promise<ecosystem_orgs> {
    try {
      const ecosystemRoleDetails = await this.prisma.ecosystem_roles.findFirst({
        where: {
          name: EcosystemRoles.ECOSYSTEM_LEAD
        }
      });
      const ecosystemLeadDetails = await this.prisma.ecosystem_orgs.findFirst({
        where: {
          ecosystemRoleId: ecosystemRoleDetails.id
        }
      });
      return ecosystemLeadDetails;

    } catch (error) {
      this.logger.error(`Error in getting ecosystem lead details for the ecosystem: ${error.message} `);
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
      this.logger.error(`Error in getting getPlatformConfigDetails for the ecosystem - error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  async storeTransactionRequest(
    schemaTransactionResponse: SchemaTransactionResponse,
    type: endorsementTransactionType
  ): Promise<object> {
    try {
      const { endorserDid, authorDid, requestPayload, status, ecosystemOrgId } = schemaTransactionResponse;
      return await this.prisma.endorsement_transaction.create({
        data: {
          endorserDid,
          authorDid,
          requestPayload,
          status,
          ecosystemOrgId,
          responsePayload: '',
          type
        }
      });
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }
    
  // eslint-disable-next-line camelcase
  async deleteInvitations(invitationId: string): Promise<ecosystem_invitations> {
    try {
      const deletedInvitation = await this.prisma.ecosystem_invitations.delete({
        where: {
          id: invitationId,
          status: EcosystemInvitationStatus.PENDING
        }
      });
      return deletedInvitation;
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  
  // eslint-disable-next-line camelcase
  async getEcosystemOrgDetailsbyId(orgId: string): Promise<ecosystem_orgs> {
    try {
      //need to change
      const ecosystemLeadDetails = await this.prisma.ecosystem_orgs.findFirst({
        where: {
          orgId
        }
      });
      return ecosystemLeadDetails;

    } catch (error) {
      this.logger.error(`Error in getting ecosystem lead details for the ecosystem: ${error.message} `);
      throw error;
    }
  }
  // eslint-disable-next-line camelcase
  async getEndorsementTransactionById(endorsementId: string, status:endorsementTransactionStatus): Promise<endorsement_transaction> {
    try {
      const ecosystemLeadDetails = await this.prisma.endorsement_transaction.findFirst({
        where: {
          id: endorsementId,
          status
        },
        include: {
          ecosystemOrgs: {
            select: {
              orgId: true
            }
          }
        }
      });

      return ecosystemLeadDetails;

    } catch (error) {
      this.logger.error(`Error in getting ecosystem lead details for the ecosystem: ${error.message} `);
      throw error;
    }
  }

  async updateTransactionDetails(
    endorsementId: string,
    schemaTransactionRequest: string

    // eslint-disable-next-line camelcase,
  ): Promise<object> {
    try {
      const updatedTransaction = await this.prisma.endorsement_transaction.update({
        where: { id: endorsementId },
        data: {
          responsePayload: schemaTransactionRequest,
          status: endorsementTransactionStatus.SIGNED
        }
      });

      return updatedTransaction;

    } catch (error) {
      this.logger.error(`Error in updating endorsement transaction: ${error.message}`);
      throw error;
    }
  }

  async updateTransactionStatus(
    endorsementId: string,
    status:endorsementTransactionStatus
    // eslint-disable-next-line camelcase,
  ): Promise<object> {
    try {
      const updatedTransaction = await this.prisma.endorsement_transaction.update({
        where: { id: endorsementId },
        data: {
          status 
        }
      });

      return updatedTransaction;

    } catch (error) {
      this.logger.error(`Error in updating endorsement transaction: ${error.message}`);
      throw error;
    }
  }

}