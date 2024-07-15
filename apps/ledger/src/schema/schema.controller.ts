import { Controller } from '@nestjs/common';
import { SchemaService } from './schema.service';
import { MessagePattern } from '@nestjs/microservices';
import {
  ISchema,
  ISchemaCredDeffSearchInterface,
  ISchemaExist,
  ISchemaSearchPayload
} from './interfaces/schema-payload.interface';
import { schema } from '@prisma/client';
import {
  ICredDefWithPagination,
  ISchemaData,
  ISchemaDetails,
  ISchemasWithPagination
} from '@credebl/common/interfaces/schema.interface';
import { IschemaPayload } from './interfaces/schema.interface';

@Controller('schema')
export class SchemaController {
  constructor(private readonly schemaService: SchemaService) {}

  @MessagePattern({ cmd: 'create-schema' })
  async createSchema(payload: IschemaPayload): Promise<ISchemaData> {
    const { schemaDetails, user, orgId } = payload;
    return this.schemaService.createSchema(schemaDetails, user, orgId);
  }

  @MessagePattern({ cmd: 'get-schemas-details' })
  async getSchemasDetails(payload: {templateIds: string[]}): Promise<schema[]> {
    const { templateIds } = payload;
    return this.schemaService.getSchemaDetails(templateIds);
  }

  @MessagePattern({ cmd: 'get-schema-by-id' })
  async getSchemaById(payload: ISchema): Promise<schema> {
    const { schemaId, orgId } = payload;
    return this.schemaService.getSchemaById(schemaId, orgId);
  }

  @MessagePattern({ cmd: 'get-schemas' })
  async getSchemas(schemaSearch: ISchemaSearchPayload): Promise<ISchemasWithPagination> {
    const { schemaSearchCriteria, orgId } = schemaSearch;
    return this.schemaService.getSchemas(schemaSearchCriteria, orgId);
  }

  @MessagePattern({ cmd: 'get-cred-def-list-by-schemas-id' })
  async getcredDefListBySchemaId(payload: ISchemaCredDeffSearchInterface): Promise<ICredDefWithPagination> {
    return this.schemaService.getcredDefListBySchemaId(payload);
  }

  @MessagePattern({ cmd: 'get-all-schemas' })
  async getAllSchema(schemaSearch: ISchemaSearchPayload): Promise<ISchemaDetails> {
    const { schemaSearchCriteria } = schemaSearch;
    return this.schemaService.getAllSchema(schemaSearchCriteria);
  }

  @MessagePattern({ cmd: 'schema-exist' })
  async schemaExist(payload: ISchemaExist): Promise<{
    id: string;
    createDateTime: Date;
    createdBy: string;
    lastChangedDateTime: Date;
    lastChangedBy: string;
    name: string;
    version: string;
    attributes: string;
    schemaLedgerId: string;
    publisherDid: string;
    issuerId: string;
    orgId: string;
    ledgerId: string;
  }[]> {
    return this.schemaService.schemaExist(payload);
  }
}