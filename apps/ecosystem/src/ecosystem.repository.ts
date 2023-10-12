import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '@credebl/prisma-service';
// eslint-disable-next-line camelcase
import { credential_definition, ecosystem, ecosystem_invitations, ecosystem_orgs, ecosystem_roles, endorsement_transaction, org_agents, platform_config, schema } from '@prisma/client';
import { DeploymentModeType, EcosystemInvitationStatus, EcosystemOrgStatus, EcosystemRoles, endorsementTransactionStatus, endorsementTransactionType } from '../enums/ecosystem.enum';
import { updateEcosystemOrgsDto } from '../dtos/update-ecosystemOrgs.dto';
import { SaveSchema, SchemaTransactionResponse, saveCredDef } from '../interfaces/ecosystem.interfaces';
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
              orgName,
              orgDid,
              deploymentMode: DeploymentModeType.PROVIDER_HOSTED
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
      const { orgId, status, ecosystemRoleId, ecosystemId, orgName, orgDid } = createEcosystemOrgsDto;

      return this.prisma.ecosystem_orgs.create({
        data: {
          orgId: String(orgId),
          ecosystemId,
          status,
          ecosystemRoleId,
          orgName,
          orgDid,
          deploymentMode: DeploymentModeType.PROVIDER_HOSTED
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
            ecosystem: true,
            ecosystemRole:true
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
          select: {
            id: true,
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
      });
      return ecosystemLeadDetails;

    } catch (error) {
      this.logger.error(`Error in getting ecosystem lead details for the ecosystem: ${error.message} `);
      throw error;
    }
  }
  // eslint-disable-next-line camelcase
  async getEndorsementTransactionById(endorsementId: string, status: endorsementTransactionStatus): Promise<endorsement_transaction> {
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
    status: endorsementTransactionStatus
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

  async saveSchema(schemaResult: SaveSchema): Promise<schema> {
    try {
      const { name, version, attributes, schemaLedgerId, issuerId, createdBy, lastChangedBy, publisherDid, orgId, ledgerId } = schemaResult;
      const saveResult = await this.prisma.schema.create({
        data: {
          name,
          version,
          attributes,
          schemaLedgerId,
          issuerId,
          createdBy: Number(createdBy),
          lastChangedBy: Number(lastChangedBy),
          publisherDid,
          orgId: Number(orgId),
          ledgerId
        }
      });
      return saveResult;
    } catch (error) {
      this.logger.error(`Error in storing schema for submit transaction: ${error.message} `);
      throw error;
    }
  }

  // eslint-disable-next-line camelcase
  async saveCredDef(credDefResult: saveCredDef): Promise<credential_definition> {
    try {
      const { schemaLedgerId, tag, credentialDefinitionId, revocable, createdBy, orgId, schemaId } = credDefResult;
      const saveResult = await this.prisma.credential_definition.create({
        data: {
          schemaLedgerId,
          tag,
          credentialDefinitionId,
          revocable,
          createdBy: Number(createdBy),
          orgId: Number(orgId),
          schemaId
        }
      });
      return saveResult;
    } catch (error) {
      this.logger.error(`Error in saving credential-definition for submit transaction: ${error.message} `);
      throw error;
    }
  }

  async getSchemaDetailsById(schemaLedgerId: string): Promise<schema | null> {
    try {
      const schemaDetails = await this.prisma.schema.findFirst({
        where: {
          schemaLedgerId
        }
      });
      return schemaDetails;
    } catch (error) {
      this.logger.error(`Error in fetching schema details for submit transaction: ${error.message}`);
      throw error;
    }
  }

  async updateEndorsementRequestStatus(ecosystemId: string, endorsementId: string): Promise<object> {
    try {
    
    const endorsementTransaction = await this.prisma.endorsement_transaction.findUnique({
    where: { id: endorsementId, status: endorsementTransactionStatus.REQUESTED }
    });
    
    if (!endorsementTransaction) {
    throw new NotFoundException(ResponseMessages.ecosystem.error.EndorsementTransactionNotFoundException);
    }
    const { ecosystemOrgId } = endorsementTransaction;
   
    const endorsementTransactionEcosystemOrg = await this.prisma.ecosystem_orgs.findUnique({
    where: { id: ecosystemOrgId }
    });
   
    if (endorsementTransactionEcosystemOrg.ecosystemId === ecosystemId) {
    const updatedEndorsementTransaction = await this.prisma.endorsement_transaction.update({
    where: { id: endorsementId },
    data: {
    status: endorsementTransactionStatus.DECLINED
    }
    });
   
    return updatedEndorsementTransaction;
    } else {
    throw new NotFoundException(ResponseMessages.ecosystem.error.OrgOrEcosystemNotFoundExceptionForEndorsementTransaction);
    }
    } catch (error) {
    this.logger.error(`Error in updating endorsement transaction status: ${error.message}`);
    throw error;
    }
    }
}
