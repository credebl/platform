import { ResponseMessages } from "@credebl/common/response-messages";
import { PrismaService } from "@credebl/prisma-service";
import { Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
// eslint-disable-next-line camelcase
import { org_agents, platform_config, presentations } from "@prisma/client";
import { IWebhookProofPresentation } from "../interfaces/verification.interface";


@Injectable()
export class VerificationRepository {
    constructor(private readonly prisma: PrismaService, private readonly logger: Logger) { }

    /**
     * Get org agent details
     * @param orgId 
     * @returns 
     */
    // eslint-disable-next-line camelcase
    async getAgentEndPoint(orgId: number): Promise<org_agents> {
        try {

            const agentDetails = await this.prisma.org_agents.findFirst({
                where: {
                    orgId
                }
            });

            if (!agentDetails) {
                throw new NotFoundException(ResponseMessages.verification.error.notFound);
            }

            return agentDetails;

        } catch (error) {
            this.logger.error(`[getProofPresentations] - error in get agent endpoint : ${error.message} `);
            throw error;
        }
    }

    async storeProofPresentation(id: string, proofPresentationPayload: IWebhookProofPresentation): Promise<presentations> {
        try {

            return await this.prisma.presentations.upsert({
                where: {
                    connectionId: proofPresentationPayload.connectionId
                },
                update: {
                    state: proofPresentationPayload.state,
                    threadId: proofPresentationPayload.threadId,
                    isVerified: proofPresentationPayload.isVerified
                },
                create: {
                    connectionId: proofPresentationPayload.connectionId,
                    state: proofPresentationPayload.state,
                    threadId: proofPresentationPayload.threadId,
                    isVerified: proofPresentationPayload.isVerified,
                    orgId: parseInt(id)
                }
            });

        } catch (error) {
            this.logger.error(`[getProofPresentations] - error in get agent endpoint : ${error.message} `);
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