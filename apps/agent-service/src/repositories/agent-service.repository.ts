import { PrismaService } from '@credebl/prisma-service';
import { ConflictException, Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line camelcase
import { Prisma, ledgerConfig, ledgers, org_agents, org_agents_type, org_dids, organisation, platform_config, user } from '@prisma/client';
import { ICreateOrgAgent, ILedgers, IOrgAgent, IOrgAgentsResponse, IOrgLedgers, IStoreAgent, IStoreDidDetails, IStoreOrgAgentDetails, LedgerNameSpace, OrgDid } from '../interface/agent-service.interface';
import { AgentType, PrismaTables } from '@credebl/enum/enum';

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

    async getLedgerConfigByOrgId(): Promise<ledgerConfig[]> {
        try {
            const ledgerConfigData = await this.prisma.ledgerConfig.findMany();
            return ledgerConfigData;
        } catch (error) {
            this.logger.error(`[getGenesisUrl] - get genesis URL: ${JSON.stringify(error)}`);
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
            const { id, userId, ledgerId, did, didDoc, ...commonFields } = storeOrgAgentDetails;
            const firstLedgerId = Array.isArray(ledgerId) ? ledgerId[0] : null;
            const data = {
                ...commonFields,
                ledgerId: firstLedgerId,
                createdBy: userId,
                lastChangedBy: userId,
                didDocument: didDoc,
                orgDid: did
            };
            
            // eslint-disable-next-line camelcase
            const query: Promise<org_agents> = id ?
                this.prisma.org_agents.update({
                    where: { id },
                    data
                }) :
                this.prisma.org_agents.create({ data });

            return { id: (await query).id };
        } catch (error) {
            this.logger.error(`[storeAgentDetails] - store agent details: ${JSON.stringify(error)}`);
            throw error;
        }
    }
      
    /**
     * Store DID details
     * @param storeDidDetails
     * @returns did details
     */
    // eslint-disable-next-line camelcase
    async storeDidDetails(storeDidDetails: IStoreDidDetails): Promise<org_dids> {
        try {
          const {orgId, did, didDocument, isPrimaryDid, userId, orgAgentId} = storeDidDetails;

          return this.prisma.org_dids.create({
                data: {
                    orgId,
                    did,
                    didDocument,
                    isPrimaryDid,
                    createdBy: userId,
                    lastChangedBy: userId,
                    orgAgentId
                }
            });
        } catch (error) {
            this.logger.error(`[storeDidDetails] - Store DID details: ${JSON.stringify(error)}`);
            throw error;
        }
    }


    /**
     * Set primary DID
     * @param did
     * @returns did details
     */
    // eslint-disable-next-line camelcase
    async setPrimaryDid(orgDid: string, orgId: string, didDocument: Prisma.JsonValue): Promise<org_agents> {
        try {
          return await this.prisma.org_agents.update({
                 where: {
                    orgId
                 },
                data: {
                    orgDid,
                    didDocument
                }
            });
           
        } catch (error) {
            this.logger.error(`[setprimaryDid] - Update DID details: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    // eslint-disable-next-line camelcase
    async updateLedgerId(orgId: string, ledgerId: string): Promise<org_agents> {
        try {
          return await this.prisma.org_agents.update({
                 where: {
                    orgId
                 },
                data: {
                    ledgerId
                }
            });
           
        } catch (error) {
            this.logger.error(`[updateLedgerId] - Update ledgerId: ${JSON.stringify(error)}`);
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

    // eslint-disable-next-line camelcase
    async getOrgAgentType(orgAgentId: string): Promise<org_agents_type> {
        try {
          const orgAgent = await this.prisma.org_agents_type.findUnique({
            where: {
              id: orgAgentId
            }
          });
         
          return orgAgent;

        } catch (error) {
          this.logger.error(`[getOrgAgentType] - error: ${JSON.stringify(error)}`);
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

  async getLedgerByNameSpace(indyNamespace: string): Promise<LedgerNameSpace> {
    try {
      if (indyNamespace) {
        const ledgerDetails = await this.prisma.ledgers.findFirstOrThrow({
          where: {
            indyNamespace
          }
        });
        return ledgerDetails;
      }

    } catch (error) {
      this.logger.error(`[getLedgerByNameSpace] - get indy ledger: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getOrgDid(orgId: string): Promise<OrgDid[]> {
    try {
      const orgDids = await this.prisma.org_dids.findMany({
        where: {
          orgId
        }
      });
      return orgDids;
    } catch (error) {
      this.logger.error(`[getOrgDid] - get org DID: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async updateIsPrimaryDid(orgId: string, isPrimaryDid: boolean): Promise<Prisma.BatchPayload> {
    try {
      const updateOrgDid = await this.prisma.org_dids.updateMany({
        where: {
          orgId
        },
        data: {
          isPrimaryDid
        }
      });
      return updateOrgDid;
    } catch (error) {
      this.logger.error(`[getOrgDid] - get org DID: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async deleteOrgAgentByOrg(orgId: string): Promise<{orgDid: Prisma.BatchPayload;
    agentInvitation: Prisma.BatchPayload;
    // eslint-disable-next-line camelcase
    deleteOrgAgent: org_agents;
    }> {
        const tablesToCheck = [
            `${PrismaTables.CONNECTIONS}`,
            `${PrismaTables.CREDENTIALS}`,
            `${PrismaTables.PRESENTATIONS}`,
            `${PrismaTables.ECOSYSTEM_INVITATIONS}`,
            `${PrismaTables.ECOSYSTEM_ORGS}`
        ];

    try {
        return await this.prisma.$transaction(async (prisma) => {
            const referenceCounts = await Promise.all(
                tablesToCheck.map(table => prisma[table].count({ where: { orgId } }))
            );

            referenceCounts.forEach((count, index) => {
                if (0 < count) {
                    throw new ConflictException(`Organization ID ${orgId} is referenced in the table ${tablesToCheck[index]}`);
                }
            });

            // Concurrently delete related records
            const [orgDid, agentInvitation] = await Promise.all([
                prisma.org_dids.deleteMany({ where: { orgId } }),
                prisma.agent_invitations.deleteMany({ where: { orgId } })
            ]);

            // Delete the organization agent
            const deleteOrgAgent = await prisma.org_agents.delete({ where: { orgId } });

            return {orgDid, agentInvitation, deleteOrgAgent};
        });
    } catch (error) {
        this.logger.error(`[deleteOrgAgentByOrg] - Error deleting org agent record: ${error.message}`);
        throw error;
    }
}

    async getLedger(name: string): Promise<ILedgers> {
        try {
          const ledgerData = await this.prisma.ledgers.findFirstOrThrow({
            where: {
             name
            }
          });
          return ledgerData;
        } catch (error) {
          this.logger.error(`[getLedger] - get org ledger: ${JSON.stringify(error)}`);
          throw error;
        }
      }

}