/* eslint-disable camelcase */
import { CredDefPayload, GetAllCredDefsDto, IPlatformCredDefs, ISaveCredDef } from '../interfaces/create-credential-definition.interface';
import { PrismaService } from '@credebl/prisma-service';
import { credential_definition, org_agents, org_agents_type, organisation, schema } from '@prisma/client';
import { Injectable, Logger } from '@nestjs/common';
import { ResponseMessages } from '@credebl/common/response-messages';
import { BulkCredDefSchema, CredDefSchema } from '../interfaces/credential-definition.interface';
import { ICredDefData, IPlatformCredDefDetails } from '@credebl/common/interfaces/cred-def.interface';
import { SchemaType, SortValue } from '@credebl/enum/enum';
import { ISchemaResponse } from '../interfaces';

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

    async getAllPlatformCredDefsDetails(credDefsPayload: IPlatformCredDefs): Promise<IPlatformCredDefDetails> {
        try {
            const { ledgerId, search, sortBy, sortField, pageNumber, pageSize } = credDefsPayload || {};
          const credDefResult = await this.prisma.credential_definition.findMany({
            where: {
                schema: {
                    ledgerId
                },
              OR: [
                { tag: { contains: search, mode: 'insensitive' } },
                { credentialDefinitionId: { contains: search, mode: 'insensitive' } },
                { schemaLedgerId: { contains: search, mode: 'insensitive' } }
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
              [sortField]: SortValue.DESC === sortBy ? SortValue.DESC : SortValue.ASC
            },
            take: Number(pageSize),
            skip: (pageNumber - 1) * pageSize
          });
    
          const credDefCount = await this.prisma.credential_definition.count({
            where: {
                schema: {
                    ledgerId
                }
            }
          });
          return { credDefCount, credDefResult };
        } catch (error) {
          this.logger.error(`Error in getting credential definitions: ${error}`);
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

    async getAllCredDefs(credDefSearchCriteria: GetAllCredDefsDto, orgId: string): Promise<ICredDefData[]> {
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
                    [credDefSearchCriteria.sorting]: SortValue.DESC === credDefSearchCriteria.sortByValue ? SortValue.DESC : SortValue.ASC
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
                    [credDefSortBy]: SortValue.DESC === sortValue ? SortValue.DESC : SortValue.ASC
                }
            });

            const schemaLedgerIdArray = credentialDefinitions.map((credDef) => credDef.schemaLedgerId);

            const schemas = await this.prisma.schema.findMany({
                where: {
                    schemaLedgerId: {
                        in: schemaLedgerIdArray
                    },
                    type: SchemaType.INDY
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

    async getAllSchemaByOrgIdAndType(orgId: string, schemaType: string): Promise<ISchemaResponse[]> {
        try { 
            return await this.prisma.schema.findMany({
                where: {
                    orgId,
                    type: schemaType 
                },
                select: {
                    name: true,
                    version: true,
                    schemaLedgerId: true,
                    orgId: true,
                    attributes: true,
                    createDateTime: true,
                    createdBy: true,
                    organisation: {
                        select:{
                          name: true,
                          userOrgRoles: {
                            select: {
                              user: {
                                select: {
                                  firstName: true
                                }
                              }
                            }
                          }
                        }
                      }
                }
            });
        } catch (error) {
            this.logger.error(`[getAllSchemaByOrgIdAndType] - error: ${JSON.stringify(error)}`);
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

    async storeCredDefRecord(credDefDetails: ISaveCredDef): Promise<credential_definition> {
      try {
        const saveResult = await this.prisma.credential_definition.create({
            data: {
                schemaLedgerId: credDefDetails.schemaLedgerId,
                tag: credDefDetails.tag,
                credentialDefinitionId: credDefDetails.credentialDefinitionId,
                revocable: credDefDetails.revocable,
                createdBy: credDefDetails.createdBy,
                lastChangedBy: credDefDetails.lastChangedBy,
                orgId: credDefDetails.orgId,
                schemaId: credDefDetails.schemaId
            }
          });
          return saveResult;
        } catch (error) {
          this.logger.error(
            `Error in saving credential-definition: ${error.message} `
          );
          throw error;
        }
    }

}