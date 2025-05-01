/* eslint-disable prefer-destructuring */
/* eslint-disable camelcase */

import { ConflictException, Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
// eslint-disable-next-line camelcase
import { Prisma, agent_invitations, org_agents, org_invitations, user, user_org_roles, organisation, org_roles } from '@prisma/client';

import { CreateOrganizationDto } from '../dtos/create-organization.dto';
import { IGetDids, IDidDetails, IDidList, IGetOrgById, IGetOrganization, IPrimaryDidDetails, IUpdateOrganization, ILedgerNameSpace, OrgInvitation, ILedgerDetails, IOrgRoleDetails, IOrgDetails } from '../interfaces/organization.interface';
import { Invitation, PrismaTables, SortValue } from '@credebl/enum/enum';
import { PrismaService } from '@credebl/prisma-service';
import { UserOrgRolesService } from '@credebl/user-org-roles';
import { ResponseMessages } from '@credebl/common/response-messages';
import { IOrganizationInvitations, IOrganization, IOrganizationDashboard, IDeleteOrganization} from '@credebl/common/interfaces/organization.interface';
import { IOrgRoles } from 'libs/org-roles/interfaces/org-roles.interface';

@Injectable()
export class OrganizationRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
    private readonly userOrgRoleService: UserOrgRolesService
  ) { }

  async getPlatformConfigDetails(): Promise<object> {
    try {
      const platformConfigdetails = await this.prisma.platform_config.findMany();
      return platformConfigdetails;
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  /**
   *
   * @param name
   * @returns Organization exist details
   */

  async checkOrganizationNameExist(name: string): Promise<organisation> {
    try {
      return this.prisma.organisation.findFirst({
        where: {
          name
        }
      });
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  
  async checkOrganizationSlugExist(orgSlug: string): Promise<organisation> {
    try {
      return this.prisma.organisation.findUnique({
        where: {
          orgSlug
        }
      });
    } catch (error) {
      this.logger.error(`error in checkOrganizationSlugExist: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  /**
   *
   * @body CreateOrganizationDto
   * @returns create Organization
   */

  async createOrganization(createOrgDto: CreateOrganizationDto): Promise<organisation> {
    try {
      const orgData = this.prisma.organisation.create({
        data: {
          name: createOrgDto.name,
          logoUrl: createOrgDto.logo,
          description: createOrgDto.description,
          website: createOrgDto.website,
          orgSlug: createOrgDto.orgSlug,
          publicProfile: false,
          registrationNumber: createOrgDto.registrationNumber,
          countryId: createOrgDto.countryId,
          cityId: createOrgDto.cityId,
          stateId: createOrgDto.stateId,
          createdBy: createOrgDto.createdBy,
          lastChangedBy: createOrgDto.lastChangedBy
        }
      });
      return orgData;
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new error;
    }
  }

  /**
   *
   * @body updateOrgDto
   * @returns update Organization
   */

  async updateOrganization(updateOrgDto: IUpdateOrganization): Promise<organisation> {
    try {
      return this.prisma.organisation.update({
        where: {
          id: String(updateOrgDto.orgId)
        },
        data: {
          name: updateOrgDto.name,
          logoUrl: updateOrgDto.logo,
          description: updateOrgDto.description,
          website: updateOrgDto.website,
          orgSlug: updateOrgDto.orgSlug,
          publicProfile: updateOrgDto.isPublic,
          lastChangedBy: updateOrgDto.userId
        }
      });
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new error;
    }
  }

  async getAgentInvitationDetails(orgId: string): Promise<agent_invitations> {
    try {
      const response = await this.prisma.agent_invitations.findUnique({
        where: {
          id: orgId
        }
      });
      return response;
    } catch (error) {
      this.logger.error(`error in getting agent invitation details: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async updateConnectionInvitationDetails(orgId: string, connectionInvitation: string): Promise<Prisma.BatchPayload> {
    try {
      const temp = await this.prisma.agent_invitations.updateMany({
          where: {orgId},
        data: {
          connectionInvitation
        }
      });
      return temp;

    } catch (error) {
      this.logger.error(`Error in updating connection invitation details: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  /**
   *
   * @body userOrgRoleDto
   * @returns create userOrgRole
   */

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async createUserOrgRole(userOrgRoleDto): Promise<user_org_roles> {
    try {

      return this.prisma.user_org_roles.create({
        data: {
          userId: userOrgRoleDto.userId,
          orgRoleId: userOrgRoleDto.orgRoleId,
          orgId: userOrgRoleDto.orgId
        }

      });

    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  /**
   *
   * @body sendInvitationDto
   * @returns orgInvitaionDetails
   */

  async createSendInvitation(
    email: string,
    orgId: string,
    userId: string,
    orgRoleId: string[]
  ): Promise<org_invitations> {
    try {
      return this.prisma.org_invitations.create({
        data: {
          email,
          user: { connect: { id: userId } },
          organisation: { connect: { id: orgId } },
          orgRoles: orgRoleId,
          status: Invitation.PENDING,
          createdBy: userId,
          lastChangedBy: userId
        }
      });
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  /**
   *
   * @param orgId
   * @returns OrganizationDetails
   */

  async getOrganizationDetails(orgId: string): Promise<organisation> {
    try {
      if (!orgId) {
        throw new NotFoundException(ResponseMessages.organisation.error.orgNotFound);
      }
      const orgDetails = await this.prisma.organisation.findFirst({
        where: {
          id: orgId
        }
      });

      return orgDetails;
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  async getOrganizationOwnerDetails(orgId: string, role: string): Promise<IOrganization> {
    try {
      const organization = await this.prisma.organisation.findFirst({
        where: {
          id: orgId
        },
        include: {
          userOrgRoles: {
            where: {
              orgRole: {
                name: role
              }
            },
            include: {
              user: {
                select: {
                  email: true,
                  username: true,
                  id: true,
                  firstName: true,
                  lastName: true,
                  isEmailVerified: true
                }
              },
              orgRole: true
            }
          }
        }
      });
      
      if (!organization) {
        throw new NotFoundException(ResponseMessages.organisation.error.organizationNotFound);
      }
      
      return organization;
    } catch (error) {
      this.logger.error(`error in getOrganizationOwnerDetails: ${JSON.stringify(error)}`);
      throw error;
    }
  }


  async getAllOrgInvitations(
    email: string,
    status: string,
    pageNumber: number,
    pageSize: number,
    search = ''
  ): Promise<IOrganizationInvitations> {

    this.logger.log(search);
    const query = {
      email,
      status
    };
    return this.getOrgInvitationsPagination(query, pageNumber, pageSize);
  }

  async updateOrganizationById(
    data: object,
     orgId: string): Promise<organisation> {
    try {
      const orgDetails = await this.prisma.organisation.update({
        where: { id: orgId },
        data
      });
      return orgDetails;
    } catch (error) {
      this.logger.error(`Error in updateOrganizationById: ${error.message}`);
      throw error;
    }
  }


  async getOrgInvitations(
    queryObject: object
  ): Promise<org_invitations[]> {
    try {
      return this.prisma.org_invitations.findMany({
        where: {
          ...queryObject
        },
        include: {
          organisation: true
        }
      });
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }


  async getOrgInvitationsCount(orgId: string): Promise<number> {
    try {
      return this.prisma.org_invitations.count({
        where: {
          orgId
        }
      });
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  async getOrgInvitationsPagination(queryObject: object, pageNumber: number, pageSize: number): Promise<IOrganizationInvitations> {
    try {
      const result = await this.prisma.$transaction([
        this.prisma.org_invitations.findMany({
          where: {
            ...queryObject
          },
          select: {
            id: true,
            orgId: true,
            email: true,
            userId: true,
            status: true,
            createDateTime: true,
            createdBy: true,
            organisation: {
              select: {
                id: true,
                name: true,
                logoUrl: true
              }
            },
            orgRoles: true
          },
          take: pageSize,
          skip: (pageNumber - 1) * pageSize,
          orderBy: {
            createDateTime: 'desc'
          }
        }),
        this.prisma.org_invitations.count({
          where: {
            ...queryObject
          }
        })
      ]);

      const invitations = result[0];
      const totalCount = result[1];
      const totalPages = Math.ceil(totalCount / pageSize);

      return { totalPages, invitations };
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  async getInvitationsByOrgId(orgId: string, pageNumber: number, pageSize: number, search = ''): Promise<IOrganizationInvitations> {
    try {
      const query = {
        orgId,
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { status: { contains: search, mode: 'insensitive' } }
        ]
      };

      return this.getOrgInvitationsPagination(query, pageNumber, pageSize);
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new error;
    }
  }

  async getUser(id: string): Promise<user> {
    try {
      const getUserById = await this.prisma.user.findUnique({
        where:{
          id
      }});
      return getUserById;
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new error;
    }
  }

  async getOrganization(queryObject: object): Promise<IGetOrgById> {
    try {
      return this.prisma.organisation.findFirst({
        where: {
          ...queryObject
        },
        select: {
          id: true,
          name: true,
          description: true,
          orgSlug: true,
          logoUrl: true,
          website: true,
          publicProfile: true,
          cityId: true,
          countryId: true,
          stateId: true,
          schema: {
            select: {
              id: true,
              name: true
            }
          },
          userOrgRoles: {
            select: {
              orgRole: true
            }
          },
          org_agents: {
            select: {
              id: true,
              orgDid: true,
              didDocument: true,
              walletName: true,
              agentEndPoint: true,
              agentSpinUpStatus: true,
              agentsTypeId: true,
              orgAgentTypeId: true,
              createDateTime: true,
              agent_invitations: {
                select: {
                  id: true,
                  connectionInvitation: true,
                  multiUse: true
                }
              },
              org_agent_type: true,
              ledgers: {
                select: {
                  id: true,
                  name: true,
                  networkType: true
                }
              }
            }
          }
          
        }
      });
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  async getOrgDashboard(orgId: string): Promise<IOrganizationDashboard> {

    const query = {
      where: {
        orgId
      }
    };

    try {

      const usersCount = await this.prisma.user.count(
        {
        where: {
          userOrgRoles: {
            some: {
              orgId
            }
          }
        }
        }
      );

      const schemasCount = await this.prisma.schema.count({
        where: {
          orgId,
          isSchemaArchived: false
        }
      });
      
      const credentialsCount = await this.prisma.credentials.count({
        ...query
      });

      const presentationsCount = await this.prisma.presentations.count({
        ...query
      });

      return {
        usersCount,
        schemasCount,
        credentialsCount,
        presentationsCount
      };

    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new error;
    }
  }


  /**
   *
   * @param id
   * @returns Invitation details
   */
  async getInvitationById(id: string): Promise<org_invitations> {
    try {
      return this.prisma.org_invitations.findUnique({
        where: {
          id
        },
        include: {
          organisation: true
        }
      });
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getUnregisteredClientOrgs(): Promise<organisation[]> {
    try {
      const recordsWithNullIdpId = await this.prisma.organisation.findMany({
        where: {
          idpId: null
        },
        include: {
          userOrgRoles: {
            include: {
              user: {
                select: {
                  email: true,
                  username: true,
                  id: true,
                  keycloakUserId: true,
                  isEmailVerified: true
                }
              },
              orgRole: true
            }
          }
        }
      });

      return recordsWithNullIdpId;
      
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  /**
   *
   * @param queryObject
   * @param data
   * @returns Updated org invitation response
   */
  async updateOrgInvitation(id: string, data: object): Promise<object> {
    try {
      return this.prisma.org_invitations.update({
        where: {
          id
        },
        data: {
          ...data
        }
      });
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException('Unable to update org invitation');
    }
  }

  async getOrganizations(
    queryObject: object,
    filterOptions: object,
    pageNumber: number,
    pageSize: number,
    role?: string,
    userId?: string
  ): Promise<IGetOrganization> {
    try {
      const sortByName = SortValue.DESC;
      const result = await this.prisma.$transaction([
        this.prisma.organisation.findMany({
          where: {
            ...queryObject,
            userOrgRoles: {
              some: {
                orgRole: {
                  name: role
                },
                userId
              }
            }
          },
          select: {
            id: true,
            name: true,
            description: true,
            logoUrl: true,
            orgSlug: true,
            createDateTime: true,
            countryId:true,
            stateId: true,
            cityId: true,
            userOrgRoles: {
              where: {
                orgRole: {
                  name: role
                },
                ...filterOptions
              },
              select: {
                id: true,
                orgRole: {
                  select: {
                    id: true,
                    name: true,
                    description: true
                  }
                }
              }
            },
            org_agents: {
              select : {
                orgDid: true
              }
            }
          },
          take: pageSize,
          skip: (pageNumber - 1) * pageSize,
          orderBy: {
            createDateTime: sortByName
          }
        }),
        this.prisma.organisation.count({
          where: {
            ...queryObject,
            userOrgRoles: {
              some: {
                orgRole: {
                  name: role
                },
                userId
              }
            }
          }
        })
      ]);
      const organizations = result[0];
      const totalCount = result[1];
      const totalPages = Math.ceil(totalCount / pageSize);

      return { totalCount, totalPages, organizations };
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  async userOrganizationCount(userId: string): Promise<number> {
    const getOrgCount = await this.prisma.organisation.count({
      where: {
        userOrgRoles: {
          some: { userId }
        }
      }
    });
    return getOrgCount;
  }
  /**
  *
  * @param name
  * @returns Organization exist details
  */

  async checkOrganizationExist(name: string, orgId: string): Promise<organisation> {
    try {
      return this.prisma.organisation.findUnique({
        where: {
          id: orgId,
          name
        }
      });
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getOrgProfile(id: string): Promise<organisation> {
    try {
      return this.prisma.organisation.findUnique({
        where: {
          id
        }
      });
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getCredDefByOrg(orgId: string): Promise<{
      tag: string;
      credentialDefinitionId: string;
      schemaLedgerId: string;
      revocable: boolean;
  }[]> {
    try {
      return this.prisma.credential_definition.findMany({
        where: {
          orgId
        },
        select: {
          tag: true,
          credentialDefinitionId: true,
          schemaLedgerId: true,
          revocable: true,
          createDateTime: true
        },
        orderBy: {
          createDateTime: 'desc'
        }
      });
    } catch (error) {
      this.logger.error(`Error in getting agent DID: ${error}`);
      throw error;
    }
  }

  async getAgentEndPoint(orgId: string): Promise<org_agents> {
    try {

      const agentDetails = await this.prisma.org_agents.findFirst({
        where: {
          orgId
        }
      });

      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.organisation.error.notFound);
      }

      return agentDetails;

    } catch (error) {
      this.logger.error(`Error in get getAgentEndPoint: ${error.message} `);
      throw error;
    }
  }

  async deleteOrg(id: string):Promise<{
    deletedUserActivity: Prisma.BatchPayload;
    deletedUserOrgRole: Prisma.BatchPayload;
    deletedOrgInvitations: Prisma.BatchPayload;
    deletedNotification: Prisma.BatchPayload;
    deleteOrg: IDeleteOrganization
  }> {
    const tablesToCheck = [
      `${PrismaTables.ORG_AGENTS}`,
      `${PrismaTables.ORG_DIDS}`,
      `${PrismaTables.AGENT_INVITATIONS}`,
      `${PrismaTables.CONNECTIONS}`,
      `${PrismaTables.CREDENTIALS}`,
      `${PrismaTables.PRESENTATIONS}`,
      `${PrismaTables.FILE_UPLOAD}`
    ];

    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Check for references in all tables in parallel
        const referenceCounts = await Promise.all(
                tablesToCheck.map(table => prisma[table].count({ where: { orgId: id } }))
        );

        referenceCounts.forEach((count, index) => {
          if (0 < count) {
            throw new ConflictException(`Organization ID ${id} is referenced in the table ${tablesToCheck[index]}`);
          }
        });

        const deletedNotification = await prisma.notification.deleteMany({ where: { orgId: id } });

        const deletedUserActivity = await prisma.user_activity.deleteMany({ where: { orgId: id } });

        const deletedUserOrgRole = await prisma.user_org_roles.deleteMany({ where: { orgId: id } });

        const deletedOrgInvitations = await prisma.org_invitations.deleteMany({ where: { orgId: id } });

        await this.prisma.schema.updateMany({
          where: { orgId: id },
          data: { orgId: null }
        });

        await this.prisma.credential_definition.updateMany({
          where: { orgId: id },
          data: { orgId: null }
        });

        // If no references are found, delete the organization
        const deleteOrg = await prisma.organisation.delete({ where: { id } });

          return {deletedUserActivity, deletedUserOrgRole, deletedOrgInvitations, deletedNotification, deleteOrg};
      });
      // return result;
    } catch (error) {
      this.logger.error(`Error in deleteOrg: ${error}`);
      throw error;
    }
  }

  /**
   *
   * @param id
   * @returns Delete Invitation
   */
  async deleteOrganizationInvitation(id: string): Promise<org_invitations> {
    try {
      return await this.prisma.org_invitations.delete({
        where: {
          id
        }
      });
    } catch (error) {
      this.logger.error(`Delete Org Invitation Error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  // eslint-disable-next-line camelcase
  async getAllOrganizationDid(orgId: string): Promise<IDidList[]> {
    try {
      return this.prisma.org_dids.findMany({
        where:{
          orgId
        },
        select:{
          id: true,
          createDateTime: true,
          did: true,
          lastChangedDateTime: true,
          isPrimaryDid: true
        }
      });
    } catch (error) {
      this.logger.error(`error in getAllOrganizationDid: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async setOrgsPrimaryDid(primaryDidDetails: IPrimaryDidDetails): Promise<string> {
    try {
      const {did, didDocument, id, orgId, networkId} = primaryDidDetails;
      await this.prisma.$transaction([
        this.prisma.org_dids.update({
          where: {
            id
          },
          data: {
            isPrimaryDid: true
          }
        }),
        this.prisma.org_agents.update({
          where: {
            orgId
          },
          data: {
            orgDid: did,
            didDocument,
            ledgerId: networkId
          }
        })
      ]);
      return ResponseMessages.organisation.success.didDetails;
    } catch (error) {
      this.logger.error(`[setOrgsPrimaryDid] - Update DID details: ${JSON.stringify(error)}`);
      throw error;
    }
  }

async getDidDetailsByDid(did:string): Promise<IDidDetails> {
    try {
      const didDetails = await this.prisma.org_dids.findFirst({
        where: {
          did
        }
      });
      
      if (!didDetails) {
        throw new NotFoundException(ResponseMessages.organisation.error.didNotFound);
      }
      
      return didDetails;
    } catch (error) {
      this.logger.error(`[getDidDetailsByDid] - get DID details: ${JSON.stringify(error)}`);
      throw error;
    }
  }

 async getPerviousPrimaryDid(orgId:string): Promise<IDidDetails> {
    try {
      const primaryDid = await this.prisma.org_dids.findFirst({
        where: {
          orgId,
          isPrimaryDid: true
        }
      });
      
      if (!primaryDid) {
        throw new NotFoundException(ResponseMessages.organisation.error.didNotFound);
      }
      
      return primaryDid;
    } catch (error) {
      this.logger.error(`[getPerviousPrimaryDid] - get DID details: ${JSON.stringify(error)}`);
      throw error;
    }
  }

 async getDids(orgId:string): Promise<IGetDids[]> {
    try {
      return this.prisma.org_dids.findMany({
        where: {
          orgId
        }
      });
    } catch (error) {
      this.logger.error(`[getDids] - get all DIDs: ${JSON.stringify(error)}`);
      throw error;
    }
  }

 async setPreviousDidFlase(id:string): Promise<IDidDetails> {
    try {
      return this.prisma.org_dids.update({
        where: {
          id
        },
        data: {
          isPrimaryDid: false
        }
      });
    } catch (error) {
      this.logger.error(`[setPreviousDidFlase] - Update DID details: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getOrgInvitationsByOrg(orgId: string): Promise<OrgInvitation[]> {
    try {
      return this.prisma.org_invitations.findMany({
        where: {
          orgId
        }
      });
    } catch (error) {
      this.logger.error(`[getOrgInvitationsByOrg] - get organization invitations: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getNetworkByNameSpace(nameSpace: string): Promise<ILedgerNameSpace> {
    try {
      const network = await this.prisma.ledgers.findFirst({
        where: {
          indyNamespace: nameSpace
        }
      });
      
      if (!network) {
        throw new NotFoundException(ResponseMessages.ledger.error.NotFound);
      }
      
      return network;
    } catch (error) {
      this.logger.error(`[getNetworkByIndyNameSpace] - get network by namespace: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getLedger(name: string): Promise<ILedgerDetails> {
    try {
      const ledgerData = await this.prisma.ledgers.findFirst({
        where: {
          name
        }
      });
      
      if (!ledgerData) {
        throw new NotFoundException(ResponseMessages.ledger.error.NotFound);
      }
      return ledgerData;
    } catch (error) {
      this.logger.error(`[getLedger] - get ledger details: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getOrgRole(id: string[]): Promise<IOrgRoleDetails[]> {
    try {
      const orgRoleData = await this.prisma.org_roles.findMany({
        where: {
          id: {
            in: id
          }
        }
      });
      return orgRoleData;
    } catch (error) {
      this.logger.error(`[getOrgRole] - get org role details: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getUserOrgRole(userId: string, orgId: string): Promise<string[]> {
    try {
      const userOrgRoleDetails = await this.prisma.user_org_roles.findMany({
        where: {
          userId,
          orgId
        },
    select:{
          orgRoleId: true
        }
      });
      // Map the result to an array of orgRoleId
     const orgRoleIds = userOrgRoleDetails.map(role => role.orgRoleId);

      return orgRoleIds;
    } catch (error) {
      this.logger.error(`[getUserOrgRole] - get user org role details: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getAgentTypeByAgentTypeId(orgAgentTypeId: string): Promise<string> {
    try {
      const { agent } = await this.prisma.org_agents_type.findFirst({
        where: {
          id: orgAgentTypeId
        }
      });

      return agent;
    } catch (error) {
      this.logger.error(`[getAgentTypeByAgentTypeId] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getOrgRoles(roleName: string): Promise<org_roles> {
    try {
      const orgRoleDetails = await this.prisma.org_roles.findFirst({
        where: {
          name: roleName
        }
      });
      
      if (!orgRoleDetails) {
        throw new NotFoundException(ResponseMessages.organisation.error.orgRoleIdNotFound);
      }

      return orgRoleDetails;
    } catch (error) {
      this.logger.error(`[getOrgRoles] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getAllOrgRolesDetails(): Promise<IOrgRoles[]> {
    try {
      const orgRoleDetails = await this.prisma.org_roles.findMany();
      return orgRoleDetails;
    } catch (error) {
      this.logger.error(`[getAllOrgRolesDetails] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getOrgRolesById(orgRoles: string[]): Promise<object[]> {
    try {
      const roleDetails = await this.prisma.org_roles.findMany({
          where: {
            id: {
              in: orgRoles
            }
          },
          select: {
            id: true,
            name: true,
            description: true
          }
        });      
        return roleDetails;
    } catch (error) {
      this.logger.error(`[getOrgRolesById] - error: ${JSON.stringify(error)}`);
    }
  }

  async getOrganisationsByIds(organisationIds: string[]): Promise<object[]> {
    try {
      const organisations = await this.prisma.organisation.findMany({
        where: {
          id: {
            in: organisationIds
          }
        },
        select: {
          id: true,
          name: true,
          orgSlug: true
        }
      });

      return organisations;
    } catch (error) {
      this.logger.error(`Error fetching organisations: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async handleGetOrganisationData(data: {orgIds: string[], search: string}): Promise<IOrgDetails> {
    try {
      const { orgIds, search } = data;

      // Fetch organisation data with optional search filtering
      const organisations = await this.prisma.organisation.findMany({
        where: {
          id: { in: orgIds },
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            // eslint-disable-next-line camelcase
            { org_agents: { some: { orgDid: { contains: search, mode: 'insensitive' } } } }
          ]
        },
        select: {
          id: true,
          name: true,
          orgSlug: true
        }
      });

      // Fetch org_agents data
      const orgAgents = await this.prisma.org_agents.findMany({
        where: {
          orgId: { in: orgIds },
          ...(search && { orgDid: { contains: search, mode: 'insensitive' } })
        }
      });

      const userOrgRoles = await this.prisma.user_org_roles.findMany({
        where: {
          orgId: { in: orgIds }
        }
      });

      return {
        organisations,
        orgAgents,
        userOrgRoles
      };

    } catch (error) {
      this.logger.error(`Error in handleGetOrganisationData: ${JSON.stringify(error)}`);
      throw error;
    }
  }

}