/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Controller, Logger } from '@nestjs/common';

import { CredentialDefinitionService } from './credential-definition.service';
import { MessagePattern } from '@nestjs/microservices';
import {  GetAllCredDefsPayload, GetCredDefBySchemaId, IPlatformCredDefs } from './interfaces/create-credential-definition.interface';
import { CreateCredDefPayload, GetCredDefPayload } from './interfaces/create-credential-definition.interface';
import { credential_definition } from '@prisma/client';
import { CredDefSchema } from './interfaces/credential-definition.interface';
import { ICredDefDetails, IPlatformCredDefsData } from '@credebl/common/interfaces/cred-def.interface';
@Controller('credential-definitions')
export class CredentialDefinitionController {
    private logger = new Logger();

    constructor(private readonly credDefService: CredentialDefinitionService) { }

    @MessagePattern({ cmd: 'create-credential-definition' })
    async createCredentialDefinition(payload: CreateCredDefPayload): Promise<credential_definition> {
        return this.credDefService.createCredentialDefinition(payload);
    }

    @MessagePattern({ cmd: 'get-credential-definition-by-id' })
    async getCredentialDefinitionById(payload: GetCredDefPayload): Promise<credential_definition> {
        return this.credDefService.getCredentialDefinitionById(payload);
    }

    @MessagePattern({ cmd: 'get-all-platform-cred-defs' })
    async getAllSchema(credDefPayload: IPlatformCredDefs): Promise<IPlatformCredDefsData> {
      return this.credDefService.getAllPlatformCredDefs(credDefPayload);
    }

    @MessagePattern({ cmd: 'get-all-credential-definitions' })
    async getAllCredDefs(payload: GetAllCredDefsPayload): Promise<ICredDefDetails> {
        return this.credDefService.getAllCredDefs(payload);
    }

    @MessagePattern({ cmd: 'get-all-credential-definitions-by-schema-id' })
    async getCredentialDefinitionBySchemaId(payload: GetCredDefBySchemaId): Promise<credential_definition[]> {
        return this.credDefService.getCredentialDefinitionBySchemaId(payload);
    }

    @MessagePattern({ cmd: 'get-all-schema-cred-defs-for-bulk-operation' })
    async getAllCredDefAndSchemaForBulkOperation (payload: {orgId : string}): Promise<CredDefSchema[]> {
        return this.credDefService.getAllCredDefAndSchemaForBulkOperation(payload.orgId);
    }
}