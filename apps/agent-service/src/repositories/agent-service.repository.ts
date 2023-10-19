import { PrismaService } from '@credebl/prisma-service';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
// eslint-disable-next-line camelcase
import { ledgers, org_agents, organisation, platform_config } from '@prisma/client';
import { IStoreOrgAgentDetails } from '../interface/agent-service.interface';

@Injectable()
export class AgentServiceRepository {
    constructor(private readonly prisma: PrismaService, private readonly logger: Logger) { }

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
     * Get genesis url
     * @param id 
     * @returns 
     */
    async getGenesisUrl(ledgerId: number[]): Promise<ledgers[]> {
        try {

            const genesisData = await this.prisma.ledgers.findMany({
                where: {
                    id: {
                        in: ledgerId
                    }
                }
            });
            return genesisData;
        } catch (error) {
            this.logger.error(`[getGenesisUrl] - get genesis URL: ${JSON.stringify(error)}`);
            throw new InternalServerErrorException(error);
        }
    }

    /**
     * Get organization details
     * @param id 
     * @returns 
     */
    async getOrgDetails(id: number): Promise<organisation> {
        try {

            const oranizationDetails = await this.prisma.organisation.findFirst({
                where: {
                    id
                }
            });
            return oranizationDetails;
        } catch (error) {
            this.logger.error(`[getOrgDetails] - get organization details: ${JSON.stringify(error)}`);
            throw new InternalServerErrorException(error);
        }
    }


    /**
     * Store agent details
     * @param storeAgentDetails 
     * @returns 
     */
    // eslint-disable-next-line camelcase
    async storeOrgAgentDetails(storeOrgAgentDetails: IStoreOrgAgentDetails): Promise<org_agents> {
        try {
            return this.prisma.org_agents.create({
                data: {
                    orgDid: storeOrgAgentDetails.did,
                    verkey: storeOrgAgentDetails.verkey,
                    isDidPublic: storeOrgAgentDetails.isDidPublic,
                    agentSpinUpStatus: storeOrgAgentDetails.agentSpinUpStatus,
                    walletName: storeOrgAgentDetails.walletName,
                    agentsTypeId: storeOrgAgentDetails.agentsTypeId,
                    orgId: storeOrgAgentDetails.orgId,
                    agentEndPoint: storeOrgAgentDetails.agentEndPoint,
                    agentId: storeOrgAgentDetails.agentId ? storeOrgAgentDetails.agentId : null,
                    orgAgentTypeId: storeOrgAgentDetails.orgAgentTypeId ? storeOrgAgentDetails.orgAgentTypeId : null,
                    tenantId: storeOrgAgentDetails.tenantId ? storeOrgAgentDetails.tenantId : null,
                    ledgerId: storeOrgAgentDetails.ledgerId[0]
                }
            });
        } catch (error) {
            this.logger.error(`[storeAgentDetails] - store agent details: ${JSON.stringify(error)}`);
            throw new InternalServerErrorException(error);
        }
    }

    /**
     * Get agent details
     * @param orgId 
     * @returns 
     */
    // eslint-disable-next-line camelcase
    async getAgentDetails(orgId: number): Promise<org_agents> {
        try {

            return this.prisma.org_agents.findFirst({
                where: {
                    orgId
                }
            });
        } catch (error) {
            this.logger.error(`[getAgentDetails] - get agent details: ${JSON.stringify(error)}`);
            throw new InternalServerErrorException(error);
        }
    }

    async platformAdminAgent(platformId: number): Promise<organisation & {
        // eslint-disable-next-line camelcase
        org_agents: org_agents[];
    }> {
        try {
            const platformAdminSpinnedUp = await this.prisma.organisation.findUnique({
                where: {
                    id: platformId
                },
                include: {
                    // eslint-disable-next-line camelcase
                    org_agents: true
                }
            });
            return platformAdminSpinnedUp;
        } catch (error) {

        }
    }

    /**
    * Get agent details
    * @param orgId 
    * @returns Agent health details
    */
    // eslint-disable-next-line camelcase
    async getOrgAgentDetails(orgId: number): Promise<org_agents> {
        try {
            const oranizationAgentDetails = await this.prisma.org_agents.findFirst({
                where: {
                    orgId
                }
            });
            return oranizationAgentDetails;
        } catch (error) {
            this.logger.error(`[getAgentDetails] - get org agent health details: ${JSON.stringify(error)}`);
            throw new InternalServerErrorException(error);
        }
    }

}