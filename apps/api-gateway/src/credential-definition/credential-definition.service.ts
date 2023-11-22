import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateCredentialDefinitionDto } from './dto/create-cred-defs.dto';
import { BaseService } from '../../../../libs/service/base.service';
import { IUserRequestInterface } from '../interfaces/IUserRequestInterface';
import { GetAllCredDefsDto } from '../dtos/get-cred-defs.dto';

@Injectable()
export class CredentialDefinitionService extends BaseService {

  constructor(
    @Inject('NATS_CLIENT') private readonly credDefServiceProxy: ClientProxy
  ) {
    super('CredentialDefinitionService');
  }

  createCredentialDefinition(credDef: CreateCredentialDefinitionDto, user: IUserRequestInterface): Promise<{ response: object }> {
    const payload = { credDef, user };
    
    return this.sendNats(this.credDefServiceProxy, 'create-credential-definition', payload);
  }

  getCredentialDefinitionById(credentialDefinitionId: string, orgId: string): Promise<{ response: object }> {
    const payload = { credentialDefinitionId, orgId };
    return this.sendNats(this.credDefServiceProxy, 'get-credential-definition-by-id', payload);
  }

  getAllCredDefs(credDefSearchCriteria: GetAllCredDefsDto, user: IUserRequestInterface, orgId: string): Promise<{ response: object }> {
    const payload = { credDefSearchCriteria, user, orgId };
    return this.sendNats(this.credDefServiceProxy, 'get-all-credential-definitions', payload);
  }

  getCredentialDefinitionBySchemaId(schemaId: string): Promise<{ response: object }> {
    const payload = { schemaId };
    return this.sendNats(this.credDefServiceProxy, 'get-all-credential-definitions-by-schema-id', payload);
  }

  getAllCredDefAndSchemaForBulkOperation(orgId:string): Promise<{ response: object }> {
    const payload = { orgId };
    return this.sendNats(this.credDefServiceProxy, 'get-all-schema-cred-defs-for-bulk-operation', payload);
  }
}
