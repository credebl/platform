import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '@credebl/prisma-service';
// eslint-disable-next-line camelcase
import { credential_definition, ecosystem, ecosystem_config, ecosystem_invitations, ecosystem_orgs, ecosystem_roles, endorsement_transaction, org_agents, platform_config, schema } from '@prisma/client';
import { DeploymentModeType, EcosystemInvitationStatus, EcosystemOrgStatus, EcosystemRoles, endorsementTransactionStatus, endorsementTransactionType } from '../enums/ecosystem.enum';
import { updateEcosystemOrgsDto } from '../dtos/update-ecosystemOrgs.dto';
import { CreateEcosystem, EcoInvitationsPagination, EcosystemDetailsResult, SaveSchema, SchemaTransactionResponse, saveCredDef } from '../interfaces/ecosystem.interfaces';
import { ResponseMessages } from '@credebl/common/response-messages';
import { NotFoundException } from '@nestjs/common';
import { CommonConstants } from '@credebl/common/common.constant';
import { GetAllSchemaList } from '../interfaces/endorsements.interface';
// eslint-disable-next-line camelcase

@Injectable()
export class EcosystemRepository {

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger
  ) { }

  /**
   * Description: create ecosystem
   * @param createEcosystemDto 
   * @returns ecosystem
   */
  // eslint-disable-next-line camelcase
  async createNewEcosystem(createEcosystemDto: CreateEcosystem, ecosystemLedgers: string[]): Promise<ecosystem> {
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
            lastChangedBy: userId,
            ledgers: ecosystemLedgers
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
              deploymentMode: DeploymentModeType.PROVIDER_HOSTED,
              createdBy: userId,
              lastChangedBy: userId
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
  async updateEcosystemById(
    data: object,
     ecosystemId: string): Promise<ecosystem> {
    try {
      const editEcosystem = await this.prisma.ecosystem.update({
        where: { id: ecosystemId },
        data
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
  async getAllEcosystemDetails(orgId: string): Promise<EcosystemDetailsResult> {
    try {
      const [ecosystemDetails, ecosystemCount] = await Promise.all([
        this.prisma.ecosystem.findMany({
          where: {
            ecosystemOrgs: {
              some: {
                orgId
              }
            }
          },
          select: {
            id: true,
            name: true,
            description: true,
            logoUrl: true,
            createDateTime: true,
            lastChangedDateTime: true,
            createdBy: true,
            autoEndorsement: true,
            ecosystemOrgs: {
              where: {
                orgId
              },
              select: {
                id: true,
                orgId: true,
                status: true,
                createDateTime: true,
                lastChangedDateTime: true,
                ecosystemId: true,
                ecosystemRoleId: true,
                ecosystemRole: true
              }
            }
          }
        }),
        this.prisma.ecosystem.count({
          where: {
            ecosystemOrgs: {
              some: {
                orgId
              }
            }
          }
        })
      ]);
  
      return {
        ecosystemDetails,
        totalCount: ecosystemCount
      };
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
      throw error;
    }
  }

  async checkEcosystemNameExist(name: string): Promise<ecosystem> {
    try {
      return this.prisma.ecosystem.findFirst({
        where: {
          name
        }
      });
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
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

  /**
   * 
   * @returns Get ecosystem dashboard card count
   */
  // eslint-disable-next-line camelcase
  async getEcosystemDashboardDetails(ecosystemId: string): Promise<{ membersCount: number; endorsementsCount: number; ecosystemConfigData: ecosystem_config[] }> {
    try {
      const membersCount = await this.getEcosystemMembersCount(ecosystemId);
      const endorsementsCount = await this.getEcosystemEndorsementsCount(ecosystemId);
      const ecosystemConfigData = await this.getEcosystemConfig();
      return {
        membersCount,
        endorsementsCount,
        ecosystemConfigData
      };
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  // eslint-disable-next-line camelcase
  async getEcosystemConfig(): Promise<ecosystem_config[]> {
    try {
      const getEcosystemConfigDetails = await this.prisma.ecosystem_config.findMany();
      return getEcosystemConfigDetails;
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  // eslint-disable-next-line camelcase
  async getSpecificEcosystemConfig(key: string): Promise<ecosystem_config> {
    try {
      return await this.prisma.ecosystem_config.findFirst(
        {
          where: {
            key
          }
        }
      );
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getEcosystemMembersCount(ecosystemId: string): Promise<number> {
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
      throw error;
    }
  }

  async getEcosystemEndorsementsCount(ecosystemId: string): Promise<number> {
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
      throw error;
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
      throw error;
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
      throw error;
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
      throw error;
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
      const { orgId, status, ecosystemRoleId, ecosystemId, createdBy, lastChangedBy } = createEcosystemOrgsDto;

      return this.prisma.ecosystem_orgs.create({
        data: {
          orgId: String(orgId),
          ecosystemId,
          status,
          ecosystemRoleId,
          deploymentMode: DeploymentModeType.PROVIDER_HOSTED,
          createdBy,
          lastChangedBy
        }
      });
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw error;
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
          orgId: '',
          createdBy: userId,
          lastChangedBy: userId
        }
      });
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw error;
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
      throw error;
    }
  }


  /**
   * 
   * @param queryOptions 
   * @param filterOptions 
   * @returns users list
   */

async findEcosystemMembers(
  ecosystemId: string,
  pageNumber: number,
  pageSize: number,
  search: string,
  sortBy: string
): Promise<object> {
  try {
    const result = await this.prisma.$transaction([
      this.prisma.ecosystem_orgs.findMany({
        where: {
          ecosystemId,
          OR: [
            {
              organisation: {
                name: { contains: search, mode: 'insensitive' },
                // eslint-disable-next-line camelcase
                org_agents: {
                  some: {
                    orgDid: { contains: search, mode: 'insensitive' }
                  }
                }
              }
            }
          ]
        },
        include: {
          ecosystem: true,
          ecosystemRole: true,
          organisation: {
            select: {
              name: true,
              orgSlug: true,
              // eslint-disable-next-line camelcase
              org_agents: true
            }
          }
        },
        take: Number(pageSize),
        skip: (pageNumber - 1) * pageSize,
        orderBy: {
          createDateTime: 'asc' === sortBy ? 'asc' : 'desc'
        }
      }),
      this.prisma.ecosystem_orgs.count({
        where: {
          ecosystemId
        }
      })
    ]);
    return result;
  } catch (error) {
    this.logger.error(`error: ${JSON.stringify(error)}`);
    throw error;
  }
}

  async getEcosystemInvitationsPagination(queryObject: object, pageNumber: number, pageSize: number): Promise<EcoInvitationsPagination> {
    try {
      const result = await this.prisma.$transaction([
        this.prisma.ecosystem_invitations.findMany({
          where: {
            ...queryObject
          },
          include: {
            ecosystem: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
                ledgers: true
              }
            }
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
      throw error;
    }
  }


  async fetchEcosystemOrg(
    payload: object
  ): Promise<object> {

    return this.prisma.ecosystem_orgs.findFirst({
      where: {
        ...payload
      },
      select: {
        ecosystem: true,
        ecosystemRole: true,
        organisation: true
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
            ecosystemOrgs: {
              include: {
                organisation: {
                  select: {
                    name: true,
                    orgSlug: true
                  }
                }
              }
            },
            requestPayload: true,
            responsePayload: true,
            createDateTime: true,
            requestBody: true
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
      throw error;
    }
  }


  async getAllEcosystemSchemasDetails(payload: GetAllSchemaList): Promise<{
    schemasCount: number;
    schemasResult: {
      createDateTime: Date;
      createdBy: string;
      name: string;
      version: string;
      attributes: string;
      schemaLedgerId: string;
      publisherDid: string;
      issuerId: string;
      orgId: string;
    }[];
  }> {
    try {
      const { ecosystemId, search, pageNumber, pageSize } = payload;

      const schemaDetails = await this.prisma.endorsement_transaction.findMany({
        where: {
          type: endorsementTransactionType.SCHEMA,
          status: endorsementTransactionStatus.SUBMITED,
          ecosystemOrgs: {
            ecosystem: {
              id: ecosystemId
            }
          },
          resourceId: {
            not: {
              equals: null
            }
          }
        }
      });
      const schemaArray = [];
      this.logger.error(`In error schemaDetails2: ${JSON.stringify(schemaDetails)}`);
      schemaDetails.map((schemaData) => schemaArray.push(schemaData.resourceId));
      const schemasResult = await this.prisma.schema.findMany({
        where: {
          OR: [
            { version: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
            { schemaLedgerId: { contains: search, mode: 'insensitive' } }
          ],
          schemaLedgerId: {
            in: schemaArray
          }
        },
        take: Number(pageSize),
        skip: (pageNumber - 1) * pageSize,
        orderBy: {
          createDateTime: 'desc'
        }
      });
      const schemasCount = schemaArray.length;

      this.logger.error(`In error schemaDetails3: ${JSON.stringify(schemasResult)}`);
      return { schemasCount, schemasResult };

    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  /**
  * Description: Get getAgentEndPoint by orgId
  * @param orgId 
  * @returns Get getAgentEndPoint details
  */
  // eslint-disable-next-line camelcase
  async getAgentDetails(orgId: string): Promise<org_agents> {
    try {
      if (!orgId) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.invalidOrgId);
      }
      const agentDetails = await this.prisma.org_agents.findFirst({
        where: {
          orgId: orgId.toString()
        }
      });
      return agentDetails;

    } catch (error) {
      this.logger.error(`Error in getting getAgentEndPoint for the ecosystem: ${error.message} `);
      throw error;
    }
  }

  // eslint-disable-next-line camelcase
  async getAllAgentDetails(orgId: string): Promise<org_agents[]> {
    try {
      if (!orgId) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.invalidOrgId);
      }
      return await this.prisma.org_agents.findMany({
        where: {
          orgId: orgId.toString()
        }
      });

    } catch (error) {
      this.logger.error(`Error in getAllAgentDetails for the ecosystem: ${error.message} `);
      throw error;
    }
  }

  /**
     * Description: Get getAgentEndPoint by invalidEcosystemId
     * @param invalidEcosystemId 
     * @returns Get getAgentEndPoint details
     */
  // eslint-disable-next-line camelcase
  async getEcosystemLeadDetails(ecosystemId: string): Promise<ecosystem_orgs> {
    try {
      if (!ecosystemId) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.invalidEcosystemId);
      }
      const ecosystemRoleDetails = await this.prisma.ecosystem_roles.findFirst({
        where: {
          name: EcosystemRoles.ECOSYSTEM_LEAD
        }
      });
      const ecosystemLeadDetails = await this.prisma.ecosystem_orgs.findFirst({
        where: {
          ecosystemRoleId: ecosystemRoleDetails.id,
          ecosystemId
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
      throw error;
    }
  }

  /**
   * Get platform config details
   * @returns 
   */
  // eslint-disable-next-line camelcase
  async getEcosystemConfigDetails(key: string): Promise<ecosystem_config> {
    try {

      return this.prisma.ecosystem_config.findFirst({
        where: {
          key
        }
      });

    } catch (error) {
      this.logger.error(`Error in getting getPlatformConfigDetails for the ecosystem - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async storeTransactionRequest(
    schemaTransactionResponse: SchemaTransactionResponse,
    requestBody: object,
    type: endorsementTransactionType
  ): Promise<object> {
    try {
      const { endorserDid, authorDid, requestPayload, status, ecosystemOrgId, userId } = schemaTransactionResponse;
      return await this.prisma.endorsement_transaction.create({
        data: {
          endorserDid,
          authorDid,
          requestPayload,
          status,
          ecosystemOrgId,
          responsePayload: '',
          type,
          requestBody,
          resourceId: '',
          createdBy: userId,
          lastChangedBy: userId
        }
      });
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw error;
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
      throw error;
    }
  }


  // eslint-disable-next-line camelcase
  async getEcosystemOrgDetailsbyId(orgId: string, ecosystemId: string): Promise<ecosystem_orgs> {
    try {
      //need to change
      const ecosystemLeadDetails = await this.prisma.ecosystem_orgs.findFirst({
        where: {
          orgId,
          ecosystemId
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

  // eslint-disable-next-line camelcase
  async findRecordsByNameAndVersion(name: string, version: string): Promise<endorsement_transaction[]> {
    try {
      return this.prisma.$queryRaw`SELECT * FROM endorsement_transaction WHERE "requestBody"->>'name' = ${name} AND "requestBody"->>'version' = ${version}`;
    } catch (error) {
      this.logger.error(`Error in getting ecosystem schema: ${error.message} `);
      throw error;
    }
  }

  // eslint-disable-next-line camelcase
  async findRecordsByCredDefTag(tag: string): Promise<endorsement_transaction[]> {
    try {
      return this.prisma.$queryRaw`SELECT * FROM endorsement_transaction WHERE "requestBody"->>'tag' = ${tag}`;
    } catch (error) {
      this.logger.error(`Error in getting ecosystem credential-definition: ${error.message} `);
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

  async updateResourse(
    endorsementId: string,
    resourceId: string
    // eslint-disable-next-line camelcase,
  ): Promise<object> {
    try {
      const updatedTransaction = await this.prisma.endorsement_transaction.update({
        where: { id: endorsementId },
        data: {
          resourceId
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
          createdBy,
          lastChangedBy,
          publisherDid,
          orgId: String(orgId),
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
      const { schemaLedgerId, tag, credentialDefinitionId, revocable, createdBy, lastChangedBy, orgId, schemaId } = credDefResult;
      const saveResult = await this.prisma.credential_definition.create({
        data: {
          schemaLedgerId,
          tag,
          credentialDefinitionId,
          revocable,
          createdBy,
          lastChangedBy,
          orgId,
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

  async updateAutoSignAndSubmitTransaction(): Promise<{
    id: string;
    key: string;
    value: string;
    createDateTime: Date;
    createdBy: string;
    lastChangedDateTime: Date;
    lastChangedBy: string;
    deletedAt: Date;
  }> {
    try {

      const { id, value } = await this.prisma.ecosystem_config.findFirst({
        where: {
          key: `${CommonConstants.ECOSYSTEM_AUTO_ENDOSEMENT}`
        }
      });

      const updatedValue = 'false' === value ? 'true' : 'false';

      const updateEcosystemConfig = await this.prisma.ecosystem_config.update({
        where: {
          id
        },
        data: {
          value: updatedValue
        }
      });

      return updateEcosystemConfig;

    } catch (error) {
      this.logger.error(`Error in update auto sign and submit flag: ${error.message}`);
      throw error;
    }
  }

  async getOrgAgentType(orgAgentId: string): Promise<string> {
    try {

      const { agent } = await this.prisma.org_agents_type.findFirst({
        where: {
          id: orgAgentId
        }
      });

      return agent;
    } catch (error) {
      this.logger.error(`[getOrgAgentType] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }
}
