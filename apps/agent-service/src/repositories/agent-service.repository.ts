import { PrismaService } from '@credebl/prisma-service';
import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line camelcase
import { Prisma, ledgers, org_agents, organisation, platform_config } from '@prisma/client';
import { IStoreOrgAgentDetails } from '../interface/agent-service.interface';
import { AgentType } from '@credebl/enum/enum';

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
            throw error;
        }
    }

    /**
     * Get genesis url
     * @param id 
     * @returns 
     */
    async getGenesisUrl(ledgerId: string[]): Promise<ledgers[]> {
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
            throw error;
        }
    }

    /**
     * Get organization details
     * @param id 
     * @returns 
     */
    async getOrgDetails(id: string): Promise<organisation> {
        try {

            const oranizationDetails = await this.prisma.organisation.findFirst({
                where: {
                    id
                }
            });
            return oranizationDetails;
        } catch (error) {
            this.logger.error(`[getOrgDetails] - get organization details: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    // eslint-disable-next-line camelcase
    async createOrgAgent(agentSpinUpStatus: number): Promise<org_agents> {
        try {

            return this.prisma.org_agents.create({
                data: {
                    agentSpinUpStatus
                }
            });
        } catch (error) {
            this.logger.error(`[createOrgAgent] - create agent details: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    // eslint-disable-next-line camelcase
    async removeOrgAgent(id: string): Promise<org_agents> {
        try {

            return this.prisma.org_agents.delete({
                where: {
                    id
                }
            });
        } catch (error) {
            this.logger.error(`[removeOrgAgent] - remove org agent details: ${JSON.stringify(error)}`);
            throw error;
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

            return this.prisma.org_agents.update({
                where: {
                    id: storeOrgAgentDetails.id
                },
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
            throw error;
        }
    }

    /**
     * Get agent details
     * @param orgId 
     * @returns 
     */
    // eslint-disable-next-line camelcase
    async getAgentDetails(orgId: string): Promise<org_agents> {
        try {

            const x = await this.prisma.org_agents.findFirst({
                where: {
                    orgId
                }
            });

            return x;

        } catch (error) {

            this.logger.error(`[getAgentDetails] - get agent details: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    // eslint-disable-next-line camelcase
    async platformAdminAgent(platformOrg: string): Promise<organisation & { org_agents: org_agents[] }> {
        const platformAdminSpinnedUp = await this.prisma.organisation.findFirst({
            where: {
                name: platformOrg
            },
            include: {
                // eslint-disable-next-line camelcase
                org_agents: true
            }
        });
        return platformAdminSpinnedUp;
    }

    /**
    * Get agent details
    * @param orgId 
    * @returns Agent health details
    */
    // eslint-disable-next-line camelcase
    async getOrgAgentDetails(orgId: string): Promise<org_agents> {
        try {
            const oranizationAgentDetails = await this.prisma.org_agents.findFirst({
                where: {
                    orgId
                }
            });
            return oranizationAgentDetails;
        } catch (error) {
            this.logger.error(`[getAgentDetails] - get org agent health details: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    async getAgentTypeDetails(): Promise<string> {
        try {
            const { id } = await this.prisma.agents_type.findFirst({
                where: {
                    agent: AgentType.AFJ
                }
            });
            return id;
        } catch (error) {
            this.logger.error(`[getAgentDetails] - get org agent health details: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    async getLedgerDetails(name: string[] | string): Promise<{
        id: string;
        createDateTime: Date;
        createdBy: string;
        lastChangedDateTime: Date;
        lastChangedBy: string;
        name: string;
        networkType: string;
        poolConfig: string;
        isActive: boolean;
        networkString: string;
        registerDIDEndpoint: string;
        registerDIDPayload: Prisma.JsonValue;
        indyNamespace: string;
    }[]> {
        try {
            let whereClause;

            if (Array.isArray(name)) {
                whereClause = {
                    name: {
                        in: name
                    }
                };
            } else {
                whereClause = {
                    name
                };
            }

            const ledgersDetails = await this.prisma.ledgers.findMany({
                where: whereClause
            });
            return ledgersDetails;
        } catch (error) {
            this.logger.error(`[getLedgerDetails] - get ledger details: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    async getOrgAgentTypeDetails(agentType: string): Promise<string> {
        try {
            const { id } = await this.prisma.org_agents_type.findFirst({
                where: {
                    agent: agentType
                }
            });
            return id;
        } catch (error) {
            this.logger.error(`[getOrgAgentTypeDetails] - get org agent type details: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    async getPlatfomOrg(orgName: string): Promise<string> {
        try {
            const { id } = await this.prisma.organisation.findFirst({
                where: {
                    name: orgName
                }
            });
            return id;
        } catch (error) {
            this.logger.error(`[getPlatfomOrg] - get platform org details: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    async getAgentType(id: string): Promise<string> {
        try {
            const { agent } = await this.prisma.agents_type.findUnique({
                where: {
                    id
                }
            });
            return agent;
        } catch (error) {
            this.logger.error(`[getAgentType] - get agent type details: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    async getAgentTypeId(agentType: string): Promise<string> {
        try {
            const { id } = await this.prisma.agents_type.findFirst({
                where: {
                    agent: agentType
                }
            });
            return id;
        } catch (error) {
            this.logger.error(`[getAgentType] - get agent type details: ${JSON.stringify(error)}`);
            throw error;
        }
    }


    async getAgentApiKey(orgId: string): Promise<string> {
        try {

            const agent = await this.prisma.org_agents.findFirst({
                where: {
                    orgId
                }
            });

            return agent.apiKey;

        } catch (error) {

            this.logger.error(`[getAgentApiKey] - get api key: ${JSON.stringify(error)}`);
            throw error;
        }
    }
}