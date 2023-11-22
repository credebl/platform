/* eslint-disable prefer-destructuring */
/* eslint-disable camelcase */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
// eslint-disable-next-line camelcase
import { org_agents, org_invitations, user_org_roles } from '@prisma/client';

import { CreateOrganizationDto } from '../dtos/create-organization.dto';
import { IUpdateOrganization } from '../interfaces/organization.interface';
import { InternalServerErrorException } from '@nestjs/common';
import { Invitation } from '@credebl/enum/enum';
import { PrismaService } from '@credebl/prisma-service';
import { UserOrgRolesService } from '@credebl/user-org-roles';
import { organisation } from '@prisma/client';
import { ResponseMessages } from '@credebl/common/response-messages';

@Injectable()
export class OrganizationRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
    private readonly userOrgRoleService: UserOrgRolesService
  ) { }

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
      throw new InternalServerErrorException(error);
    }
  }

  /**
   *
   * @Body createOrgDtp
   * @returns create Organization
   */

  async createOrganization(createOrgDto: CreateOrganizationDto): Promise<organisation> {
    try {
      return this.prisma.organisation.create({
        data: {
          name: createOrgDto.name,
          logoUrl: createOrgDto.logo,
          description: createOrgDto.description,
          website: createOrgDto.website,
          orgSlug: createOrgDto.orgSlug,
          publicProfile: true

        }
      });
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  /**
   *
   * @Body updateOrgDt0
   * @returns update Organization
   */

  async updateOrganization(updateOrgDto: IUpdateOrganization): Promise<organisation> {
    try {
      return this.prisma.organisation.update({
        where: {
          id: Number(updateOrgDto.orgId)
        },
        data: {
          name: updateOrgDto.name,
          logoUrl: updateOrgDto.logo,
          description: updateOrgDto.description,
          website: updateOrgDto.website,
          orgSlug: updateOrgDto.orgSlug,
          publicProfile: updateOrgDto.isPublic
        }
      });
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }


  /**
   *
   * @Body userOrgRoleDto
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
   * @Body sendInvitationDto
   * @returns orgInvitaionDetails
   */

  async createSendInvitation(
    email: string,
    orgId: number,
    userId: number,
    orgRoleId: number[]
  ): Promise<org_invitations> {
    try {
      return this.prisma.org_invitations.create({
        data: {
          email,
          user: { connect: { id: userId } },
          organisation: { connect: { id: orgId } },
          orgRoles: orgRoleId,
          status: Invitation.PENDING
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
   * @returns OrganizationDetails
   */

  async getOrganizationDetails(orgId: number): Promise<organisation> {
    try {
      return this.prisma.organisation.findFirst({
        where: {
          id: orgId
        }
      });
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  async getAllOrgInvitations(
    email: string,
    status: string,
    pageNumber: number,
    pageSize: number,
    search = ''
  ): Promise<object> {

    this.logger.log(search);
    const query = {
      email,
      status
    };
    return this.getOrgInvitationsPagination(query, pageNumber, pageSize);
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

  async getOrgInvitationsPagination(queryObject: object, pageNumber: number, pageSize: number): Promise<object> {
    try {
      const result = await this.prisma.$transaction([
        this.prisma.org_invitations.findMany({
          where: {
            ...queryObject
          },
          include: {
            organisation: true
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

  async getInvitationsByOrgId(orgId: number, pageNumber: number, pageSize: number, search = ''): Promise<object> {
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
      throw new InternalServerErrorException(error);
    }
  }

  async getOrganization(queryObject: object): Promise<organisation> {
    try {
      return this.prisma.organisation.findFirst({
        where: {
          ...queryObject
        },
        include: {
          schema: true,
          org_agents: {
            include: {
              agents_type: true,
              agent_invitations: true,
              org_agent_type: true,
              ledgers: true
            }
          },
          userOrgRoles: {
            include: {
              user: true,
              orgRole: true
            }
          }
        }
      });
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  async getOrgDashboard(orgId: number): Promise<object> {

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
        ...query
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
      throw new InternalServerErrorException(error);
    }
  }


  /**
   *
   * @param id
   * @returns Invitation details
   */
  async getInvitationById(id: number): Promise<org_invitations> {
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
      throw new InternalServerErrorException(error);
    }
  }

  /**
   *
   * @param queryObject
   * @param data
   * @returns Updated org invitation response
   */
  async updateOrgInvitation(id: number, data: object): Promise<object> {
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
    pageSize: number
  ): Promise<object> {
    try {
      const sortByName = 'asc'; 
      const result = await this.prisma.$transaction([
        this.prisma.organisation.findMany({
          where: {
            ...queryObject
          },
          include: {
            userOrgRoles: {
              include: {
                orgRole: true
              },
              where: {
                ...filterOptions
                // Additional filtering conditions if needed
              }
            }
          },
          take: pageSize,
          skip: (pageNumber - 1) * pageSize,
          orderBy: {
            name: sortByName
            
          }
        }),
        this.prisma.organisation.count({
          where: {
            ...queryObject
          }
        })
      ]);

      const organizations = result[0];
      const totalCount = result[1];
      const totalPages = Math.ceil(totalCount / pageSize);

      return { totalPages, organizations };
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  /**
  *
  * @param name
  * @returns Organization exist details
  */

  async checkOrganizationExist(name: string, orgId: number): Promise<organisation[]> {
    try {
      return this.prisma.organisation.findMany({
        where: {
          id: orgId,
          name
        }
      });
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  async getOrgProfile(id: number): Promise<organisation> {
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

  async getCredDefByOrg(orgId: number): Promise<{
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

  async getAgentEndPoint(orgId: number): Promise<org_agents> {
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

  async deleteOrg(id: number): Promise<boolean> {
    try {
      await Promise.all([
        this.prisma.user_activity.deleteMany({ where: { orgId: id } }),
        this.prisma.user_org_roles.deleteMany({ where: { orgId: id } }),
        this.prisma.org_invitations.deleteMany({ where: { orgId: id } }),
        this.prisma.schema.deleteMany({ where: { orgId: id } }),
        this.prisma.credential_definition.deleteMany({ where: { orgId: id } }),
        this.prisma.agent_invitations.deleteMany({ where: { orgId: id } }),
        this.prisma.org_agents.deleteMany({ where: { orgId: id } }),
        this.prisma.connections.deleteMany({ where: { orgId: id } }),
        this.prisma.credentials.deleteMany({ where: { orgId: id } }),
        this.prisma.presentations.deleteMany({ where: { orgId: id } }),
        this.prisma.ecosystem_invitations.deleteMany({ where: { orgId: `${id}` } }),
        this.prisma.file_upload.deleteMany({ where: { orgId: `${id}` } }),
        this.prisma.ecosystem_orgs.deleteMany({ where: { orgId: `${id}` } }),
        this.prisma.organisation.deleteMany({ where: { id } })
      ]);
      return true;
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw error;
    }
  }
}
