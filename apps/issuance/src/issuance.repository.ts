import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@credebl/prisma-service';
// eslint-disable-next-line camelcase
import { agent_invitations, credentials, org_agents, platform_config, shortening_url } from '@prisma/client';
import { ResponseMessages } from '@credebl/common/response-messages';
@Injectable()
export class IssuanceRepository {

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
    async getAgentEndPoint(orgId: string): Promise<org_agents> {
        try {

            const agentDetails = await this.prisma.org_agents.findFirst({
                where: {
                    orgId
                }
            });

            if (!agentDetails) {
                throw new NotFoundException(ResponseMessages.issuance.error.notFound);
            }

            return agentDetails;

        } catch (error) {
            this.logger.error(`Error in get getAgentEndPoint: ${error.message} `);
            throw error;
        }
    }


    /**
 * Description: save credentials 
 * @param connectionId 
 * @returns Get saved credential details
 */
    // eslint-disable-next-line camelcase
    async saveIssuedCredentialDetails(createDateTime: string, connectionId: string, threadId: string, protocolVersion: string, credentialAttributes: object[], orgId: string): Promise<credentials> {
        try {
            
            const credentialDetails = await this.prisma.credentials.upsert({
                where: {
                    connectionId
                },
                update: {
                    lastChangedBy: `${orgId}`,
                    createDateTime,
                    threadId,
                    protocolVersion,
                    credentialAttributes,
                    orgId :String(orgId)
                },
                create: {
                    createDateTime,
                    lastChangedBy: `${orgId}`,
                    connectionId,
                    threadId,
                    protocolVersion,
                    credentialAttributes,
                    orgId :String(orgId)
                }
            });
            return credentialDetails;

        } catch (error) {
            this.logger.error(`Error in get saveIssuedCredentialDetails: ${error.message} `);
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
}