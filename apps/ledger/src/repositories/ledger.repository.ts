import { PrismaService } from '@credebl/prisma-service';
import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line camelcase
import { ledgers, user_org_roles } from '@prisma/client';
import { LedgerDetails } from '../interfaces/ledgers.interface';
import { INetworkUrl } from '@credebl/common/interfaces/schema.interface';


@Injectable()
export class LedgerRepository {
    private readonly logger = new Logger('LedgerRepository');

    constructor(
        private prisma: PrismaService
    ) { }

    async getAllLedgers(): Promise<ledgers[]> {
        try {
            return this.prisma.ledgers.findMany();
        } catch (error) {
            this.logger.error(`Error in getAllLedgers: ${error}`);
            throw error;
        }
    }

    async getNetworkUrl(indyNamespace: string): Promise<INetworkUrl> {

        try {
            return this.prisma.ledgers.findFirstOrThrow({
              where: {
                indyNamespace                
              },
              select: {
                networkUrl: true
              }
            });
        } catch (error) {
            this.logger.error(`Error in getNetworkUrl: ${error}`);
            throw error;
        }
    }

    async getNetworkById(ledgerId: string): Promise<LedgerDetails> {

        try {
            return this.prisma.ledgers.findFirst({
                where: {
                    id: ledgerId
                },
                select: {
                    id: true,
                    name: true,
                    indyNamespace: true,
                    networkUrl: true
                }
            });
        } catch (error) {
            this.logger.error(`Error in getNetworkById: ${error}`);
            throw error;
        }
    }

    //New code

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async handleGetSchemas(data: any): Promise<any> {
        try {
          const { schemaIds, search, pageSize, pageNumber } = data;
    
          // Query the schema table based on the received data
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const schemasResult: any[] = await this.prisma.schema.findMany({
            where: {
              schemaLedgerId: {
                in: schemaIds
              },
              OR: [
                { version: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { schemaLedgerId: { contains: search, mode: 'insensitive' } }
              ]
            },
            take: pageSize,
            skip: (pageNumber - 1) * pageSize,
            orderBy: {
              createDateTime: 'desc'
            }
          });
    
          // Get the total count of schemas that match the query
          const schemasCount = await this.prisma.schema.count({
            where: {
              schemaLedgerId: {
                in: schemaIds
              },
              OR: [
                { version: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { schemaLedgerId: { contains: search, mode: 'insensitive' } }
              ]
            }
          });
    
          // Return the schemas and the total count
          return {
            schemasCount,
            schemasResult
          };
        } catch (error) {
          this.logger.error(`Error handling 'get-schemas' request: ${JSON.stringify(error)}`);
          throw error;
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async handleGetOrganisationData(data): Promise<any> {
        try {
          const { orgIds, search } = data;
      
          // Fetch organisation data with optional search filtering
          const organisations = await this.prisma.organisation.findMany({
            where: {
              id: { in: orgIds },
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                // eslint-disable-next-line camelcase
                { org_agents: { some: { orgDid: { contains: search, mode: 'insensitive' } } } }
              ]
            },
            select: {
              id: true,
              name: true,
              orgSlug: true
            }
          });
      
          // Fetch org_agents data
          const orgAgents = await this.prisma.org_agents.findMany({
            where: {
              orgId: { in: orgIds },
              ...(search && { orgDid: { contains: search, mode: 'insensitive' } })
            }
          });
      
          const userOrgRoles = await this.prisma.user_org_roles.findMany({
            where: {
              orgId: { in: orgIds }
            }
          });
      
          return {
            organisations,
            orgAgents,
            userOrgRoles
          };
        } catch (error) {
          this.logger.error(`Error in handleGetOrganisationData: ${JSON.stringify(error)}`);
          throw error;
        }
      }

      // eslint-disable-next-line camelcase
      async handleGetUserOrganizations(data: { userId: string }): Promise<user_org_roles[]> {
        try {
          const { userId } = data;
      
          // Query the user_org_roles table using Prisma
          const getUserOrgs = await this.prisma.user_org_roles.findMany({
            where: {
              userId
            }
          });
      
          return getUserOrgs;
        } catch (error) {
          this.logger.error(
            `Error in handleGetUserOrganizations: ${error.message}`
          );
          throw error;
        }
      }
}