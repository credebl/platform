import { Controller } from '@nestjs/common';
import { SchemaService } from './schema.service';
import { MessagePattern } from '@nestjs/microservices';
import { ISchema, ISchemaCredDeffSearchInterface, ISchemaSearchPayload } from './interfaces/schema-payload.interface';
import { schema } from '@prisma/client';
import { ICredDefWithPagination, ISchemaData, ISchemasWithPagination } from '@credebl/common/interfaces/schema.interface';


@Controller('schema')
export class SchemaController {
    constructor(private readonly schemaService: SchemaService) { }

    @MessagePattern({ cmd: 'create-schema' })
    async createSchema(payload: ISchema): Promise<ISchemaData> {
        const { schema, user, orgId } = payload;
        return this.schemaService.createSchema(schema, user, orgId);
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

    @MessagePattern({ cmd: 'get-cred-deff-list-by-schemas-id' })
    async getcredDeffListBySchemaId(payload: ISchemaCredDeffSearchInterface): Promise<ICredDefWithPagination> {
        return this.schemaService.getcredDeffListBySchemaId(payload);
    }

    @MessagePattern({ cmd: 'get-all-schemas' })
    async getAllSchema(schemaSearch: ISchemaSearchPayload): Promise<{
        totalItems: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        nextPage: number;
        previousPage: number;
        lastPage: number;
        data: {
            createDateTime: Date;
            createdBy: string;
            name: string;
            schemaLedgerId: string;
            version: string;
            attributes: string;
            publisherDid: string;
            issuerId: string;
        }[];
    }> {
        const { schemaSearchCriteria } = schemaSearch;
        return this.schemaService.getAllSchema(schemaSearchCriteria);
    }

}
