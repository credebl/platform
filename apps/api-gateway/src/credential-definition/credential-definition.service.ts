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

  getCredentialDefinitionById(credentialDefinitionId: string, orgId: number): Promise<{ response: object }> {
    const payload = { credentialDefinitionId, orgId };
    return this.sendNats(this.credDefServiceProxy, 'get-credential-definition-by-id', payload);
  }

  getAllCredDefs(credDefSearchCriteria: GetAllCredDefsDto, user: IUserRequestInterface, orgId: number): Promise<{ response: object }> {
    const payload = { credDefSearchCriteria, user, orgId };
    return this.sendNats(this.credDefServiceProxy, 'get-all-credential-definitions', payload);
  }
}
