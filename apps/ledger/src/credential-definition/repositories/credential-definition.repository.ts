/* eslint-disable camelcase */
import { CredDefPayload, GetAllCredDefsDto } from '../interfaces/create-credential-definition.interface';
import { PrismaService } from '@credebl/prisma-service';
import { credential_definition, org_agents, org_agents_type, organisation, schema } from '@prisma/client';
import { Injectable, Logger } from '@nestjs/common';
import { ResponseMessages } from '@credebl/common/response-messages';
import { BulkCredDefSchema, CredDefSchema } from '../interfaces/credential-definition.interface';

@Injectable()
export class CredentialDefinitionRepository {
    private readonly logger = new Logger('CredentialDefinitionRepository');

    constructor(
        private prisma: PrismaService
    ) { }

    async saveCredentialDefinition(credDef: CredDefPayload): Promise<credential_definition> {
        try {
            const dbResult: credential_definition = await this.getByAttribute(
                credDef.schemaLedgerId,
                credDef.tag
            );
            if (!dbResult) {
                const saveResult = await this.prisma.credential_definition.create({
                    data: {
                        schemaLedgerId: credDef.schemaLedgerId,
                        tag: credDef.tag,
                        credentialDefinitionId: credDef.credentialDefinitionId,
                        revocable: credDef.revocable,
                        createdBy: credDef.createdBy,
                        lastChangedBy: credDef.lastChangedBy,
                        orgId: credDef.orgId,
                        schemaId: credDef.schemaId
                    }
                });
                return saveResult;
            }
        } catch (error) {
            this.logger.error(
                `${ResponseMessages.credentialDefinition.error.NotSaved}: ${error.message} `
            );
            throw error;
        }
    }

    async getSchemaById(schemaLedgerId: string): Promise<schema> {
        try {
            const response = await this.prisma.schema.findFirst({ where: { schemaLedgerId } });
            return response;
        } catch (error) {
            this.logger.error(
                `${ResponseMessages.credentialDefinition.error.NotSaved}: ${error.message} `
            );
            throw error;
        }
    }

    async getByAttribute(schema: string, tag: string): Promise<credential_definition> {
        try {
            const response = await this.prisma.credential_definition.findFirst({ where: { schemaLedgerId: schema, tag: { contains: tag, mode: 'insensitive' } } });
            return response;
        } catch (error) {
            this.logger.error(`${ResponseMessages.credentialDefinition.error.NotFound}: ${error}`);
        }
    }

    async getAllCredDefs(credDefSearchCriteria: GetAllCredDefsDto, orgId: string): Promise<{
        createDateTime: Date;
        createdBy: string;
        credentialDefinitionId: string;
        tag: string;
        schemaLedgerId: string;
        schemaId: string;
        orgId: string;
        revocable: boolean;
    }[]> {
        try {
            const credDefResult = await this.prisma.credential_definition.findMany({
                where: {
                    orgId,
                    OR: [
                        { tag: { contains: credDefSearchCriteria.searchByText, mode: 'insensitive' } },
                        { credentialDefinitionId: { contains: credDefSearchCriteria.searchByText, mode: 'insensitive' } },
                        { schemaLedgerId: { contains: credDefSearchCriteria.searchByText, mode: 'insensitive' } }
                    ]
                },
                select: {
                    createDateTime: true,
                    tag: true,
                    schemaId: true,
                    orgId: true,
                    schemaLedgerId: true,
                    createdBy: true,
                    credentialDefinitionId: true,
                    revocable: true
                },
                orderBy: {
                    [credDefSearchCriteria.sorting]: 'desc' === credDefSearchCriteria.sortByValue ? 'desc' : 'asc'
                },
                take: credDefSearchCriteria.pageSize,
                skip: (credDefSearchCriteria.pageNumber - 1) * credDefSearchCriteria.pageSize
            });
            return credDefResult;
        } catch (error) {
            this.logger.error(`Error in getting credential definitions: ${error}`);
            throw error;
        }
    }

    async getAgentDetailsByOrgId(orgId: string): Promise<{
        orgDid: string;
        agentEndPoint: string;
        tenantId: string
    }> {
        try {
            const schemasResult = await this.prisma.org_agents.findFirst({
                where: {
                    orgId
                },
                select: {
                    orgDid: true,
                    agentEndPoint: true,
                    tenantId: true
                }
            });
            return schemasResult;
        } catch (error) {
            this.logger.error(`Error in getting agent DID: ${error}`);
            throw error;
        }
    }

    async getAgentType(orgId: string): Promise<organisation & {
        org_agents: (org_agents & {
            org_agent_type: org_agents_type;
        })[];
    }> {
        try {
            const agentDetails = await this.prisma.organisation.findUnique({
                where: {
                    id: orgId
                },
                include: {
                    org_agents: {
                        include: {
                            org_agent_type: true
                        }
                    }
                }
            });
            return agentDetails;
        } catch (error) {
            this.logger.error(`Error in getting agent type: ${error}`);
            throw error;
        }
    }

    async getCredentialDefinitionBySchemaId(schemaId: string): Promise<credential_definition[]> {
        try {
            return this.prisma.credential_definition.findMany({
                where: {
                    schemaLedgerId: schemaId
                }

            });
        } catch (error) {
            this.logger.error(`Error in getting credential definitions: ${error}`);
            throw error;
        }
    }


    async getAllCredDefsByOrgIdForBulk(payload: BulkCredDefSchema): Promise<CredDefSchema[]> {
        try {
            const { credDefSortBy, sortValue, orgId } = payload;

            const credentialDefinitions = await this.prisma.credential_definition.findMany({
                where: {
                    orgId
                },
                select: {
                    id: true,
                    credentialDefinitionId: true,
                    tag: true,
                    createDateTime: true,
                    schemaLedgerId: true
                },
                orderBy: {
                    [credDefSortBy]: 'desc' === sortValue ? 'desc' : 'asc'
                }
            });

            const schemaLedgerIdArray = credentialDefinitions.map((credDef) => credDef.schemaLedgerId);

            const schemas = await this.prisma.schema.findMany({
                where: {
                    schemaLedgerId: {
                        in: schemaLedgerIdArray
                    }
                },
                select: {
                    name: true,
                    version: true,
                    schemaLedgerId: true,
                    orgId: true,
                    attributes: true
                }
            });


            // Match Credential Definitions with Schemas and map to CredDefSchema
            const matchingSchemas = credentialDefinitions.map((credDef) => {

                const matchingSchema = schemas.find((schema) => schema.schemaLedgerId === credDef.schemaLedgerId);
                if (matchingSchema) {
                    return {
                        credentialDefinitionId: credDef.credentialDefinitionId,
                        schemaCredDefName: `${matchingSchema.name}:${matchingSchema.version}-${credDef.tag}`,
                        schemaName: matchingSchema.name,
                        schemaVersion: matchingSchema.version,
                        schemaAttributes: matchingSchema.attributes,
                        credentialDefinition: credDef.tag
                    };
                }
                return null;
            });

            // Filter out null values (missing schemas) and return the result
            return matchingSchemas.filter((schema) => null !== schema) as CredDefSchema[];
        } catch (error) {
            this.logger.error(`Error in listing all credential definitions with schema details: ${error}`);
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