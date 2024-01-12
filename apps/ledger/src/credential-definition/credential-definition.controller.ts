/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Controller, Logger } from '@nestjs/common';

import { CredentialDefinitionService } from './credential-definition.service';
import { MessagePattern } from '@nestjs/microservices';
import { ICredDefList, CreateCredDefPayload, GetCredDefPayload, ICredDefBySchemaId } from './interfaces/create-credential-definition.interface';
import { credential_definition } from '@prisma/client';
import { CredDefSchema } from './interfaces/credential-definition.interface';
import { ICredDefCount } from '@credebl/common/interfaces/cred-def.interface';

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

 /**
   * Fetch all credential definitions of provided organization id
   * @param orgId 
   * @returns All credential definitions of provided organization id
   */
    @MessagePattern({ cmd: 'get-all-credential-definitions' })
    async getAllCredDefs(payload: ICredDefList): Promise<ICredDefCount> {
        return this.credDefService.getAllCredDefs(payload);
    }

  /**
   * Get an existing credential definitions by schema Id
   * @param schemaId 
   * @returns Credential definitions by schema Id
   */
    @MessagePattern({ cmd: 'get-all-credential-definitions-by-schema-id' })
    async getCredentialDefinitionBySchemaId(payload: ICredDefBySchemaId): Promise<credential_definition[]> {
        return this.credDefService.getCredentialDefinitionBySchemaId(payload);
    }

    @MessagePattern({ cmd: 'get-all-schema-cred-defs-for-bulk-operation' })
    async getAllCredDefAndSchemaForBulkOperation (payload: {orgId : string}): Promise<CredDefSchema[]> {
        return this.credDefService.getAllCredDefAndSchemaForBulkOperation(payload.orgId);
    }
}