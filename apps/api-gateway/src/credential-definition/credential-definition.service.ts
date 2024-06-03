import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateCredentialDefinitionDto } from './dto/create-cred-defs.dto';
import { BaseService } from '../../../../libs/service/base.service';
import { IUserRequestInterface } from '../interfaces/IUserRequestInterface';
import { GetAllCredDefsDto } from '../dtos/get-cred-defs.dto';
import { ICredDef, ICredDefs } from './interfaces';
import { ICredDefData } from '@credebl/common/interfaces/cred-def.interface';

@Injectable()
export class CredentialDefinitionService extends BaseService {

  constructor(
    @Inject('NATS_CLIENT') private readonly credDefServiceProxy: ClientProxy
  ) {
    super('CredentialDefinitionService');
  }

  createCredentialDefinition(credDef: CreateCredentialDefinitionDto, user: IUserRequestInterface): Promise<ICredDef> {
    const payload = { credDef, user };   
    return this.sendNatsMessage(this.credDefServiceProxy, 'create-credential-definition', payload);
  }

  getCredentialDefinitionById(credentialDefinitionId: string, orgId: string): Promise<object> {
    const payload = { credentialDefinitionId, orgId };
    return this.sendNatsMessage(this.credDefServiceProxy, 'get-credential-definition-by-id', payload);
  }

  getAllCredDefs(credDefSearchCriteria: GetAllCredDefsDto, user: IUserRequestInterface, orgId: string): Promise<ICredDefData> {
    const payload = { credDefSearchCriteria, user, orgId };
    return this.sendNatsMessage(this.credDefServiceProxy, 'get-all-credential-definitions', payload);
  }

  getCredentialDefinitionBySchemaId(schemaId: string): Promise<ICredDefs> {
    const payload = { schemaId };
    return this.sendNatsMessage(this.credDefServiceProxy, 'get-all-credential-definitions-by-schema-id', payload);
  }
}
