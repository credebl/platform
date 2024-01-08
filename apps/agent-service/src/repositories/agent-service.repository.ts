import { PrismaService } from '@credebl/prisma-service';
import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line camelcase
import { ledgers, org_agents, organisation, platform_config, user } from '@prisma/client';
import { ICreateOrgAgent, IStoreOrgAgentDetails, IOrgAgent, IOrgAgentsResponse, IOrgLedgers, IStoreAgent } from '../interface/agent-service.interface';
import { AgentType } from '@credebl/enum/enum';

@Injectable()
export class AgentServiceRepository {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: Logger
    ) { }

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
            if (id) {
                const oranizationDetails = await this.prisma.organisation.findUnique({
                    where: {
                        id
                    }
                });
                return oranizationDetails;
            }
        } catch (error) {
            this.logger.error(`[getOrgDetails] - get organization details: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    // eslint-disable-next-line camelcase
    async createOrgAgent(agentSpinUpStatus: number, userId: string): Promise<ICreateOrgAgent> {
        try {

            return this.prisma.org_agents.create({
                data: {
                    agentSpinUpStatus,
                    createdBy: userId,
                    lastChangedBy: userId
                },
                select: {
                    id: true
                }
            });
        } catch (error) {
            this.logger.error(`[createOrgAgent] - create agent details: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    // eslint-disable-next-line camelcase
    async removeOrgAgent(id: string): Promise<void> {
        try {
            if (id) {

                await this.prisma.org_agents.delete({
                    where: {
                        id
                    }
                });
            }
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
    async storeOrgAgentDetails(storeOrgAgentDetails: IStoreOrgAgentDetails): Promise<IStoreAgent> {
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
                    ledgerId: storeOrgAgentDetails.ledgerId[0],
                    apiKey: storeOrgAgentDetails.apiKey
                },
                select: {
                    id: true
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
    async getAgentDetails(orgId: string): Promise<IOrgAgent> {
        try {

            if (orgId) {

                return this.prisma.org_agents.findUnique({
                    where: {
                        orgId
                    },
                    select: {
                        agentSpinUpStatus: true
                    }
                });
            }

        } catch (error) {
            this.logger.error(`[getAgentDetails] - get agent details: ${JSON.stringify(error)}`);
            throw error;
        }
    }

     // eslint-disable-next-line camelcase
     async platformAdminAgent(platformOrg: string): Promise<IOrgAgentsResponse> {
        return this.prisma.organisation.findFirstOrThrow({
            where: {
                name: platformOrg
            },
            select: {
                // eslint-disable-next-line camelcase
                org_agents: {
                    select: {
                        agentSpinUpStatus: true,
                        agentEndPoint: true,
                        apiKey: true
                    }
                }
            }
        });
    }

    async getAgentTypeDetails(): Promise<string> {
        try {
            const { id } = await this.prisma.agents_type.findFirstOrThrow({
                where: {
                    agent: AgentType.AFJ
                }
            });
            return id;
        } catch (error) {
            this.logger.error(`[getAgentTypeDetails] - get org agent health details: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    async getLedgerDetails(name: string[] | string): Promise<IOrgLedgers[]> {
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
                where: whereClause,
                select: {
                    id: true
                }
            });
            return ledgersDetails;
        } catch (error) {
            this.logger.error(`[getLedgerDetails] - get ledger details: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    async getOrgAgentTypeDetails(agentType: string): Promise<string> {
        try {
            const { id } = await this.prisma.org_agents_type.findFirstOrThrow({
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
            const { id } = await this.prisma.organisation.findFirstOrThrow({
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
            const { id } = await this.prisma.agents_type.findFirstOrThrow({
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

    /**
   * Get agent details
   * @param orgId
   * @returns Agent health details
   */
    // eslint-disable-next-line camelcase
    async getOrgAgentDetails(orgId: string): Promise<org_agents> {
        try {
            if (orgId) {

                const oranizationAgentDetails = await this.prisma.org_agents.findUnique({
                    where: {
                        orgId
                    }
                });
                return oranizationAgentDetails;
            }
        } catch (error) {
            this.logger.error(`[getOrgAgentDetails] - get org agent health details: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    async getPlatfomAdminUser(platformAdminUserEmail: string): Promise<user> {
        try {
            const platformAdminUser = await this.prisma.user.findUnique({
                where: {
                    email: platformAdminUserEmail
                }
            });
            return platformAdminUser;
        } catch (error) {
            this.logger.error(`[getPlatfomAdminUser] - get platform admin user: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    // eslint-disable-next-line camelcase
  async getAgentApiKey(orgId: string): Promise<org_agents> {
    try {
      if (orgId) {
        const agent = await this.prisma.org_agents.findUnique({
          where: {
            orgId
          }
        });
        return agent;
      }

    } catch (error) {
      this.logger.error(`[getAgentApiKey] - get api key: ${JSON.stringify(error)}`);
      throw error;
    }
  }
}
