import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@credebl/prisma-service';
// eslint-disable-next-line camelcase
import { agent_invitations, org_agents, platform_config, shortening_url } from '@prisma/client';
import { IConnectionSearchCriteria, ICreateConnection, OrgAgent } from './interfaces/connection.interfaces';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { IConnectionsListCount } from '@credebl/common/interfaces/connection.interface';
import { SortValue } from '@credebl/enum/enum';
// import { OrgAgent } from './interfaces/connection.interfaces';
@Injectable()
export class ConnectionRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger
  ) {}

  /**
   * Description: Get getAgentEndPoint by orgId
   * @param connectionId
   * @returns Get getAgentEndPoint details
   */
  // eslint-disable-next-line camelcase
  async getAgentEndPoint(orgId: string): Promise<OrgAgent> {
    try {
      const agentDetails = await this.prisma.org_agents.findFirst({
        where: {
          orgId
        },
        include: {
          organisation: true
        }
      });
      return agentDetails;
    } catch (error) {
      this.logger.error(`Error in get getAgentEndPoint: ${error.message} `);
      throw error;
    }
  }

  /**
   * Description: Save connection details
   * @param connectionInvitation
   * @param agentId
   * @param orgId
   * @returns Get connection details
   */
  // eslint-disable-next-line camelcase
  async saveAgentConnectionInvitations(
    connectionInvitation: string,
    agentId: string,
    orgId: string
    // eslint-disable-next-line camelcase
  ): Promise<agent_invitations> {
    try {
      const agentDetails = await this.prisma.agent_invitations.create({
        data: {
          orgId: String(orgId),
          agentId,
          connectionInvitation,
          multiUse: true
        }
      });
      return agentDetails;
    } catch (error) {
      this.logger.error(`Error in saveAgentConnectionInvitations: ${error.message} `);
      throw error;
    }
  }

  /**
   * Get agent invitation by orgId
   * @param orgId
   * @returns Get connection details
   */
  // eslint-disable-next-line camelcase
  async getConnectionInvitationByOrgId(orgId: string): Promise<agent_invitations> {
    try {
      const agentInvitationDetails = await this.prisma.agent_invitations.findFirst({
        where: {
          orgId
        }
      });
      return agentInvitationDetails;
    } catch (error) {
      this.logger.error(`Error in saveAgentConnectionInvitations: ${error.message} `);
      throw error;
    }
  }

  /**
   * Description: Save connection details
   * @param connectionInvitation
   * @param agentId
   * @param orgId
   * @returns Get connection details
   */
  // eslint-disable-next-line camelcase
  async saveConnectionWebhook(payload: ICreateConnection): Promise<object> {
    try {

      let organisationId: string;
      const { connectionDto, orgId } = payload;

      if (connectionDto?.contextCorrelationId) {
        const getOrganizationId = await this.getOrganization(connectionDto?.contextCorrelationId);
        organisationId = getOrganizationId?.orgId;
      } else {
        organisationId = orgId;
      }

      const walletLabelName = connectionDto?.theirLabel;
      let maskedTheirLabel: string;
      let firstLetters: string;
      let maskedMiddleLetters: string;
      let lastLetters: string;

      switch (true) {
        case 3 >= walletLabelName.length:
          firstLetters = walletLabelName.slice(0, 1);
          maskedMiddleLetters = walletLabelName.slice(1).replace(/./g, '*');
          maskedTheirLabel = firstLetters + maskedMiddleLetters;
          break;

        case 3 < walletLabelName.length && 6 > walletLabelName.length:
          firstLetters = walletLabelName.slice(0, 1);
          lastLetters = walletLabelName.slice(-1);
          maskedMiddleLetters = walletLabelName.slice(1, -1).replace(/./g, '*');
          maskedTheirLabel = firstLetters + maskedMiddleLetters + lastLetters;
          break;

        case 6 <= walletLabelName.length && 8 >= walletLabelName.length:
          firstLetters = walletLabelName.slice(0, 2);
          lastLetters = walletLabelName.slice(-2);
          maskedMiddleLetters = walletLabelName.slice(2, -2).replace(/./g, '*');
          maskedTheirLabel = firstLetters + maskedMiddleLetters + lastLetters;
          break;

        case 8 < walletLabelName.length:
          firstLetters = walletLabelName.slice(0, 3);
          lastLetters = walletLabelName.slice(-3);
          maskedMiddleLetters = walletLabelName.slice(3, -3).replace(/./g, '*');
          maskedTheirLabel = firstLetters + maskedMiddleLetters + lastLetters;
          break;

        default:
          maskedTheirLabel = walletLabelName;
          break;
      }

      const agentDetails = await this.prisma.connections.upsert({
        where: {
          connectionId: connectionDto?.id
        },
        update: {
          lastChangedDateTime: connectionDto?.lastChangedDateTime,
          lastChangedBy: organisationId,
          state: connectionDto?.state
        },
        create: {
          createDateTime: connectionDto?.createDateTime,
          lastChangedDateTime: connectionDto?.lastChangedDateTime,
          createdBy: organisationId,
          lastChangedBy: organisationId,
          connectionId: connectionDto?.id,
          state: connectionDto?.state,
          theirLabel: maskedTheirLabel,
          orgId: organisationId
        }
      });
      return agentDetails;
    } catch (error) {
      this.logger.error(`Error in saveConnectionWebhook: ${error.message} `);
      throw error;
    }
  }

  /**
   * Description: Save ShorteningUrl details
   * @param referenceId
   * @param connectionInvitationUrl
   * @returns Get storeShorteningUrl details
   */
  // eslint-disable-next-line camelcase
  async storeShorteningUrl(referenceId: string, connectionInvitationUrl: string): Promise<shortening_url> {
    try {
      return this.prisma.shortening_url.create({
        data: {
          referenceId,
          url: connectionInvitationUrl,
          type: null
        }
      });
    } catch (error) {
      this.logger.error(`Error in saveAgentConnectionInvitations: ${error.message} `);
      throw error;
    }
  }

  // eslint-disable-next-line camelcase
  async getOrganization(tenantId: string): Promise<org_agents> {
    try {
      return this.prisma.org_agents.findFirst({
        where: {
          tenantId
        }
      });
    } catch (error) {
      this.logger.error(`Error in getOrganization in connection repository: ${error.message} `);
      throw error;
    }
  }

  /**
   * Description: Fetch ShorteningUrl details
   * @param referenceId
   * @returns Get storeShorteningUrl details
   */
  // eslint-disable-next-line camelcase
  async getShorteningUrl(referenceId: string): Promise<shortening_url> {
    try {
      return this.prisma.shortening_url.findFirst({
        where: {
          referenceId
        }
      });
    } catch (error) {
      this.logger.error(`Error in getShorteningUrl in connection repository: ${error.message} `);
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
      this.logger.error(`[getPlatformConfigDetails] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getAllConnections(
    user: IUserRequest,
    orgId: string,
    connectionSearchCriteria: IConnectionSearchCriteria
  ): Promise<IConnectionsListCount> {
    try {
      const connectionsList = await this.prisma.connections.findMany({
        where: {
          orgId,
          OR: [
            { theirLabel: { contains: connectionSearchCriteria.searchByText, mode: 'insensitive' } },
            { connectionId: { contains: connectionSearchCriteria.searchByText, mode: 'insensitive' } }
          ]
        },
        select: {
          createDateTime: true,
          createdBy: true,
          orgId: true,
          state: true,
          theirLabel: true,
          connectionId: true
        },
        orderBy: {
          [connectionSearchCriteria.sortField]: SortValue.ASC === connectionSearchCriteria.sortBy ? 'asc' : 'desc' 
        },
        take: Number(connectionSearchCriteria.pageSize),
        skip: (connectionSearchCriteria.pageNumber - 1) * connectionSearchCriteria.pageSize
      });
      const connectionCount = await this.prisma.connections.count({
          where: {
            orgId,
            OR: [
              { theirLabel: { contains: connectionSearchCriteria.searchByText, mode: 'insensitive' } },
              { connectionId: { contains: connectionSearchCriteria.searchByText, mode: 'insensitive' } }
            ]
          }
        });

      return { connectionCount, connectionsList };
    } catch (error) {
      this.logger.error(`[getAllConnections] - error: ${JSON.stringify(error)}`);
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
