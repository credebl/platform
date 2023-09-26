import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@credebl/prisma-service';
// eslint-disable-next-line camelcase
import { agent_invitations, connections, org_agents, platform_config, shortening_url } from '@prisma/client';
import { ConnectionInfo, ConnectionPayload } from './interfaces/connection.interfaces';
import { ResponseMessages } from '@credebl/common/response-messages';
@Injectable()
export class ConnectionRepository {

    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: Logger
    ) { }

    /**
     * Description: Get getAgentEndPoint by orgId
     * @param orgId 
     * @returns Get getAgentEndPoint details
     */
    // eslint-disable-next-line camelcase
    async getAgentEndPoint(orgId: number): Promise<org_agents> {
        try {

            const agentDetails = await this.prisma.org_agents.findFirst({
                where: {
                    orgId
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
    async saveAgentConnectionInvitations(connectionInvitation: string, agentId: number, orgId: number): Promise<agent_invitations> {
        try {

            const agentDetails = await this.prisma.agent_invitations.create({
                data: {
                    orgId,
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
    * Description: Save connection details
    * @param connectionPayload
    * @param orgDetails
    * @returns connection details
    */
    // eslint-disable-next-line camelcase
    async saveConnectionWebhook(connectionPayload: ConnectionPayload, orgDetails: ConnectionInfo): Promise<connections> {
        try {
            const { orgId, orgDid } = orgDetails;
            const { state, theirLabel, autoAcceptConnection, outOfBandId, threadId, id } = connectionPayload;
            const agentDetails = await this.prisma.connections.upsert({
                where: {
                    connectionId: connectionPayload?.id
                },
                update: {
                    lastChangedBy: orgId,
                    state,
                    orgDid,
                    theirLabel,
                    autoAcceptConnection,
                    outOfBandId,
                    threadId,
                    orgId
                },
                create: {
                    lastChangedBy: orgId,
                    connectionId: id,
                    state,
                    theirLabel,
                    autoAcceptConnection,
                    outOfBandId,
                    orgId,
                    orgDid,
                    threadId


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
            throw new InternalServerErrorException(error);
        }
    }

    /**
     * Description: Get agent details by tenantId
     * @param tenantId 
     * @returns Get agent details
     */
    // eslint-disable-next-line camelcase
    async getAgentDetailsByTenantId(tenantId: string): Promise<org_agents> {
        try {
            if (!tenantId) {
                throw new BadRequestException(ResponseMessages.connection.webhookError.tenantIdNotFound);

            }
            const agentDetails = await this.prisma.org_agents.findFirst({
                where: {
                    tenantId
                }
            });
            if (!agentDetails) {
                throw new NotFoundException(ResponseMessages.connection.webhookError.agentDetailsNotFound);
            }
            return agentDetails;

        } catch (error) {
            this.logger.error(`Error in get getAgentEndPoint: ${error.message} `);
            throw error;
        }
    }
}