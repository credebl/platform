import { Test, TestingModule } from '@nestjs/testing';

import { Any } from 'typeorm';
import { CreateSchemaDto } from '../dtos/create-schema.dto';
import { SchemaController } from './schema.controller';
import { SchemaService } from './schema.service';
import { plainToClassFromExist } from 'class-transformer';
import { validate } from 'class-validator';
import { CredDefSortBy, SortValue } from '../enum';

describe('schemaController Test Cases', () => {
    let controller: SchemaController;
    const mockSchemaService = {
        createSchema: jest.fn(() => ({})),
        getSchemas: jest.fn(() => ({})),
        getSchemaByOrg: jest.fn(() => ({})),
        getSchemaBySchemaId:jest.fn(() => ({})),
        getCredDefBySchemaId: jest.fn(() => ({}))
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SchemaController],
            providers: [SchemaService]
        })
            .overrideProvider(SchemaService)
            .useValue(mockSchemaService)
            .compile();
        controller = module.get<SchemaController>(
            SchemaController
        );
    });
    /////////////////////--------Create Schema -------------------//////////////////////
    describe('createSchema', () => {
        const user: any = {};

        it('should return an expected schema', async () => {
            const createSchemaDto: CreateSchemaDto = new CreateSchemaDto;
            const result = await controller.createSchema(
                createSchemaDto,
                user
            );
            expect(result).toEqual({});
        });
        ///////////////

        it('should check returned credentialdefinition is not to be null', async () => {
            const createSchemaDto: CreateSchemaDto = new CreateSchemaDto;
            const result = await controller.createSchema(
                createSchemaDto,
                user
            );
            expect(result).not.toBeNull();
        });

        ////////////
        it('Should throw error when schema version is not string', async () => {
            const schema_version_dto = { schema_version: 1 };
            const schemaVersionResult = plainToClassFromExist(
                CreateSchemaDto,
                schema_version_dto
            );
            const errors = await validate(schemaVersionResult);
            const result = await errors[0].constraints.isString;
            expect(result).toEqual('schema version must be a string');
        });


        it('Should throw error when schema name is not a string', async () => {
            const schemaName = { schema_name: 234 };
            const schemaNameResult = plainToClassFromExist(
                CreateSchemaDto,
                schemaName
            );
            const errors = await validate(schemaNameResult);
            const result = await errors[1].constraints.isString;
            expect(result).toEqual('schema name must be a string');
        });

        //////////////////////

        it('should throw error when schema version is null', async () => {
            const schema_version_dto = { schema_version: '' };
            const schemaNameResult = plainToClassFromExist(
                CreateSchemaDto,
                schema_version_dto
            );
            const errors = await validate(schemaNameResult);
            const result = await errors[0].constraints.isNotEmpty;
            expect(result).toEqual('please provide valid schema version');
        });

        it('should throw error when schema name is null', async () => {
            const schema_name_dto = { schema_name: '' };
            const schemaNameResult = plainToClassFromExist(
                CreateSchemaDto,
                schema_name_dto
            );
            const errors = await validate(schemaNameResult);
            const result = await errors[1].constraints.isNotEmpty;
            expect(result).toEqual('please provide valid schema name');
        });

        //////////////////////

        it('should throw error when attributes are not in array', async () => {
            const attribute_dto = {attributes:'testAcb'};
            const schemaattributeResult = plainToClassFromExist(
                CreateSchemaDto,
                attribute_dto
            );
            const errors = await validate(schemaattributeResult);
            const result = await errors[2].constraints.isArray;
            expect(result).toEqual('attributes must be an array');
        });

        it('should throw error when elements of attributes are not a string', async () => {
            const attribute_dto = {attributes: true};
            const schemaattributeResult = plainToClassFromExist(
                CreateSchemaDto,
                attribute_dto
            );
            const errors = await validate(schemaattributeResult);
            const result = await errors[2].constraints.isString;
            expect(result).toEqual('each value in attributes must be a string');
        });

        it('should throw error when attributes are null', async () => {
            const attribute_dto = {attributes:''};
            const schemaattributeResult = plainToClassFromExist(
                CreateSchemaDto,
                attribute_dto
            );
            const errors = await validate(schemaattributeResult);
            const result = await errors[2].constraints.isNotEmpty;
            expect(result).toEqual('please provide valid attributes');
        });

    });

///////////////////// --- get schema by ledger Id ------------///////////


    describe('getSchemas', () => {
        const user: any = {};
        const page = 1;
        const search_text = 'test search';
        const items_per_page = 1;
        const schemaSortBy = 'id';
        const sortValue = 'DESC';
        it('should return an expected schemas by ledger Id', async () => {
            const result = await controller.getSchemaWithFilters(
                page,
                search_text,
                items_per_page,
                schemaSortBy,
                sortValue,
                user
            );
            expect(result).toEqual({});
        });

    });

/////////////////////////-----  get schemas with organization id ----------
    describe('getSchemasByOrgId', () => {
        const user: any = {};
        const page = 1;
        const search_text = 'test search';
        const items_per_page = 1;
        const sortValue = 1;
        const id = 1;
        const schemaSortBy = 'DESC';
        it('should return an expected schemas by org Id', async () => {
            const result = await controller.getSchemasByOrgId(
                page,
                search_text,
                items_per_page,
                sortValue,
                schemaSortBy,
                id
            );  
            expect(result).toEqual({});
        });
    });
    
/////////////////////------- get schemas with schema ledger Id ---------------

    describe('getSchemaBySchemaId', () => {
        const user: any = {};
        const id = '1';
        it('should return an expected schemas by org Id', async () => {
            const result = await controller.getSchemaById(
               user,
               id
            );  
            expect(result).toEqual({});
        });
    });

/////////--------- get cred defs with schema Id ---///
    describe('getCredDefBySchemaId', () => {
        const user: any = {};
        const id = 1;
        const page = 1;
        const search_text = 'test';
        const items_per_page = 1;
        const orgId = 2;
        const credDefSortBy = CredDefSortBy.id;
        const sortValue = SortValue.DESC;
        const supportRevocation = 'all';
        it('should return expected cred defs by schemaId', async () => {
            const result = await controller.getCredDefBySchemaId(
                page, search_text, items_per_page, orgId, credDefSortBy, sortValue, supportRevocation, id, user
            );
            expect(result).toEqual({});
        });
        
    });


});