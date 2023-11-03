import { Controller } from '@nestjs/common';
import { SchemaService } from './schema.service';
import { MessagePattern } from '@nestjs/microservices';
import { ISchema, ISchemaCredDeffSearchInterface, ISchemaSearchInterface } from './interfaces/schema-payload.interface';
import { schema } from '@prisma/client';


@Controller('schema')
export class SchemaController {
    constructor(private readonly schemaService: SchemaService) { }

    @MessagePattern({ cmd: 'create-schema' })
    async createSchema(payload: ISchema): Promise<schema> {
        const { schema, user, orgId } = payload;
        return this.schemaService.createSchema(schema, user, orgId);
    }

    @MessagePattern({ cmd: 'get-schema-by-id' })
    async getSchemaById(payload: ISchema): Promise<schema> {
        const { schemaId, orgId } = payload;
        return this.schemaService.getSchemaById(schemaId, orgId);
    }

    @MessagePattern({ cmd: 'get-schemas' })
    async getSchemas(schemaSearch: ISchemaSearchInterface): Promise<{
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
            version: string;
            attributes: string;
            schemaLedgerId: string;
            publisherDid: string;
            issuerId: string;
            orgId: string;
        }[];
    }> {
        const { schemaSearchCriteria, user, orgId } = schemaSearch;
        return this.schemaService.getSchemas(schemaSearchCriteria, user, orgId);
    }

    @MessagePattern({ cmd: 'get-cred-deff-list-by-schemas-id' })
    async getcredDeffListBySchemaId(payload: ISchemaCredDeffSearchInterface): Promise<{
        totalItems: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        nextPage: number;
        previousPage: number;
        lastPage: number;
        data: {
            tag: string;
            credentialDefinitionId: string;
            schemaLedgerId: string;
            revocable: boolean;
        }[];
    }> {
        const { schemaId, schemaSearchCriteria, user, orgId } = payload;
        return this.schemaService.getcredDeffListBySchemaId(schemaId, schemaSearchCriteria, user, orgId);
    }

    @MessagePattern({ cmd: 'get-all-schemas' })
    async getAllSchema(schemaSearch: ISchemaSearchInterface): Promise<{
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
