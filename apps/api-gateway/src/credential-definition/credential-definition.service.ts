import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateCredentialDefinitionDto } from './dto/create-cred-defs.dto';
import { BaseService } from '../../../../libs/service/base.service';
import { IUserRequestInterface } from '../interfaces/IUserRequestInterface';
import { GetAllCredDefsDto } from '../dtos/get-cred-defs.dto';
import { ICredDefCount } from '@credebl/common/interfaces/cred-def.interface';
import { ICredDef, ICredDefs } from './interfaces';

@Injectable()
export class CredentialDefinitionService extends BaseService {

  constructor(
    @Inject('NATS_CLIENT') private readonly credDefServiceProxy: ClientProxy
  ) {
    super('CredentialDefinitionService');
  }

  createCredentialDefinition(credDef: CreateCredentialDefinitionDto, user: IUserRequestInterface): Promise<object> {
    const payload = { credDef, user };
    
    return this.sendNatsMessage(this.credDefServiceProxy, 'create-credential-definition', payload);
  }

  getCredentialDefinitionById(credentialDefinitionId: string, orgId: string): Promise<{ response: object }> {
    const payload = { credentialDefinitionId, orgId };
    return this.sendNats(this.credDefServiceProxy, 'get-credential-definition-by-id', payload);
  }

  getAllCredDefs(credDefSearchCriteria: GetAllCredDefsDto, user: IUserRequestInterface, orgId: string): Promise<ICredDefCount> {
    const payload = { credDefSearchCriteria, user, orgId };
    return this.sendNatsMessage(this.credDefServiceProxy, 'get-all-credential-definitions', payload);
  }

  getCredentialDefinitionBySchemaId(schemaId: string): Promise<ICredDef> {
    const payload = { schemaId };
    return this.sendNatsMessage(this.credDefServiceProxy, 'get-all-credential-definitions-by-schema-id', payload);
  }

  getAllCredDefAndSchemaForBulkOperation(orgId:string): Promise<ICredDefs> {
    const payload = { orgId };
    return this.sendNatsMessage(this.credDefServiceProxy, 'get-all-schema-cred-defs-for-bulk-operation', payload);
  }
}
