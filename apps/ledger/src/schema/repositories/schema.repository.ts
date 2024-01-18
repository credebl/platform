/* eslint-disable camelcase */
import { ConflictException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '@credebl/prisma-service';
import { ledgers, org_agents, org_agents_type, organisation, schema } from '@prisma/client';
import { ISchema, ISchemaSearchCriteria } from '../interfaces/schema-payload.interface';
import { ResponseMessages } from '@credebl/common/response-messages';
import { AgentDetails, ISchemasWithCount } from '../interfaces/schema.interface';
import { SortValue } from '@credebl/enum/enum';
import { ICredDefWithCount } from '@credebl/common/interfaces/schema.interface';

@Injectable()
export class SchemaRepository {
  private readonly logger = new Logger('SchemaRepository');

  constructor(
    private prisma: PrismaService
  ) { }
  async saveSchema(schemaResult: ISchema): Promise<schema> {
    try {
      if (schemaResult.schema.schemaName) {
        const schema = await this.schemaExists(
          schemaResult.schema.schemaName,
          schemaResult.schema.schemaVersion
        );

        const schemaLength = 0;
        if (schema.length !== schemaLength) {        
          throw new ConflictException(
            ResponseMessages.schema.error.exists,
            { cause: new Error(), description: ResponseMessages.errorMessages.conflict }
          );
        }
        const saveResult = await this.prisma.schema.create({
          data: {
            name: schemaResult.schema.schemaName,
            version: schemaResult.schema.schemaVersion,
            attributes: JSON.stringify(schemaResult.schema.attributes),
            schemaLedgerId: schemaResult.schema.id,
            issuerId: schemaResult.issuerId,
            createdBy: schemaResult.createdBy,
            lastChangedBy: schemaResult.changedBy,
            publisherDid: schemaResult.issuerId.split(':')[4],
            orgId: schemaResult.orgId,
            ledgerId: schemaResult.ledgerId
          }
        });
        return saveResult;
      }
    } catch (error) {
      this.logger.error(`Error in saving schema repository: ${error.message} `);
      throw error;
    }
  }

  async schemaExists(schemaName: string, schemaVersion: string): Promise<schema[]> {
    try {
      return this.prisma.schema.findMany({
        where: {
          name: {
            contains: schemaName,
            mode: 'insensitive'
          },
          version: {
            contains: schemaVersion,
            mode: 'insensitive'
          }
        }
      });
    } catch (error) {
      this.logger.error(`Error in schemaExists: ${error}`);
      throw error;
    }
  }

  async getSchemas(payload: ISchemaSearchCriteria, orgId: string): Promise<ISchemasWithCount> {
    try {
      const schemasResult = await this.prisma.schema.findMany({
        where: {
          organisation: { id: orgId },
          OR: [
            { name: { contains: payload.searchByText, mode: 'insensitive' } },
            { version: { contains: payload.searchByText, mode: 'insensitive' } },
            { schemaLedgerId: { contains: payload.searchByText, mode: 'insensitive' } },
            { issuerId: { contains: payload.searchByText, mode: 'insensitive' } }
          ]
        },
        select: {
          createDateTime: true,
          name: true,
          version: true,
          attributes: true,
          schemaLedgerId: true,
          createdBy: true,
          publisherDid: true,
          orgId: true,
          issuerId: true
        },
        orderBy: {
          [payload.sortField]: SortValue.ASC === payload.sortBy ? 'asc' : 'desc' 
        },
        take: Number(payload.pageSize),
        skip: (payload.pageNumber - 1) * payload.pageSize
      });
      const schemasCount = await this.prisma.schema.count({
        where: {
          organisation: {
            id: orgId
          }
        }
      });
      return { schemasCount, schemasResult };
    } catch (error) {
      this.logger.error(`Error in getting schemas: ${error}`);
      throw new InternalServerErrorException(
        ResponseMessages.schema.error.failedFetchSchema,
        { cause: new Error(), description: error.message }
      );

    }
  }

  async getAgentDetailsByOrgId(orgId: string): Promise<AgentDetails> {
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

  async getSchemasCredDeffList(payload: ISchemaSearchCriteria): Promise<ICredDefWithCount> {

    const {orgId, schemaId} = payload;
    
    try {
      const credDefResult = await this.prisma.credential_definition.findMany({
        where: {
          AND: [
            { orgId },
            { schemaLedgerId: schemaId }
          ]
        },
        select: {
          tag: true,
          credentialDefinitionId: true,
          schemaLedgerId: true,
          revocable: true,
          createDateTime: true
        },
        orderBy: {
          [payload.sortField]: SortValue.ASC === payload.sortBy ? 'asc' : 'desc'
        },
        take: Number(payload.pageSize),
        skip: (payload.pageNumber - 1) * payload.pageSize
      });
      const credDefCount = await this.prisma.credential_definition.count({
        where: {
          AND: [
            { orgId },
            { schemaLedgerId: schemaId }
          ]
        }
      });
      return { credDefResult, credDefCount };
    } catch (error) {
      this.logger.error(`Error in getting agent DID: ${error}`);
      throw error;
    }
  }
 
  async getAllSchemaDetails(payload: ISchemaSearchCriteria): Promise<{
    schemasCount: number;
    schemasResult: {
      createDateTime: Date;
      createdBy: string;
      name: string;
      version: string;
      attributes: string;
      schemaLedgerId: string;
      publisherDid: string;
      issuerId: string;
      orgId: string;
    }[];
  }> { 
    try {
      const schemasResult = await this.prisma.schema.findMany({
        where: {
          ledgerId: payload.ledgerId,
          OR: [
            { name: { contains: payload.searchByText, mode: 'insensitive' } },
            { version: { contains: payload.searchByText, mode: 'insensitive' } },
            { schemaLedgerId: { contains: payload.searchByText, mode: 'insensitive' } },
            { issuerId: { contains: payload.searchByText, mode: 'insensitive' } }
          ]
        },
        select: {
          createDateTime: true,
          name: true,
          version: true,
          attributes: true,
          schemaLedgerId: true,
          createdBy: true,
          publisherDid: true,
          orgId: true,
          issuerId: true
        },
        orderBy: {
          [payload.sortField]: 'desc' === payload.sortBy ? 'desc' : 'asc' 
        },
        take: Number(payload.pageSize),
        skip: (payload.pageNumber - 1) * payload.pageSize
      });

      const schemasCount = await this.prisma.schema.count({
        where: {
          ledgerId: payload.ledgerId
        }
      });
      return { schemasCount, schemasResult };
    } catch (error) {
      this.logger.error(`Error in getting schemas: ${error}`);
      throw error;
    }
  }

  async getSchemaBySchemaId(schemaId: string): Promise<schema> {
    try {
      return this.prisma.schema.findFirst({
        where: {
          schemaLedgerId: schemaId
        }
      });

    } catch (error) {
      this.logger.error(`Error in getting get schema by schema ledger id: ${error}`);
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

  async getLedgerByNamespace(LedgerName: string): Promise<ledgers> {
    try {
      return this.prisma.ledgers.findFirst({
        where: {
          indyNamespace: LedgerName
        }
      });

    } catch (error) {
      this.logger.error(`Error in getting get schema by schema ledger id: ${error}`);
      throw error;
    }
  }
}