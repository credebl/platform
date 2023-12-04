import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@credebl/prisma-service';
// eslint-disable-next-line camelcase
import { agent_invitations, connections, platform_config, shortening_url } from '@prisma/client';
import { OrgAgent } from './interfaces/connection.interfaces';
// import { OrgAgent } from './interfaces/connection.interfaces';
@Injectable()
export class ConnectionRepository {

    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: Logger
    ) { }

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
    async saveAgentConnectionInvitations(connectionInvitation: string, agentId: string, orgId: string): Promise<agent_invitations> {
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
    async saveConnectionWebhook(createDateTime: string, lastChangedDateTime: string, connectionId: string, state: string, orgDid: string, theirLabel: string, autoAcceptConnection: boolean, outOfBandId: string, orgId: string): Promise<connections> {
        try {

            const agentDetails = await this.prisma.connections.upsert({
                where: {
                    connectionId
                },
                update: {
                    lastChangedDateTime,
                    lastChangedBy: orgId,
                    state
                },
                create: {
                    createDateTime,
                    lastChangedDateTime,
                    createdBy: orgId,
                    lastChangedBy: orgId,
                    connectionId,
                    state,
                    theirLabel,
                    orgId
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