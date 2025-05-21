import type { NATSClient } from '@credebl/common/NATSClient'
import type { ICredDefData } from '@credebl/common/interfaces/cred-def.interface'
import { Inject, Injectable } from '@nestjs/common'
import type { ClientProxy } from '@nestjs/microservices'
import { BaseService } from '../../../../libs/service/base.service'
import type { GetAllCredDefsDto } from '../dtos/get-cred-defs.dto'
import type { IUserRequestInterface } from '../interfaces/IUserRequestInterface'
import type { CreateCredentialDefinitionDto } from './dto/create-cred-defs.dto'
import type { ICredDef, ICredDefs } from './interfaces'

@Injectable()
export class CredentialDefinitionService extends BaseService {
  constructor(
    @Inject('NATS_CLIENT') private readonly credDefServiceProxy: ClientProxy,
    private readonly natsClient: NATSClient
  ) {
    super('CredentialDefinitionService')
  }

  createCredentialDefinition(credDef: CreateCredentialDefinitionDto, user: IUserRequestInterface): Promise<ICredDef> {
    const payload = { credDef, user }
    return this.natsClient.sendNatsMessage(this.credDefServiceProxy, 'create-credential-definition', payload)
  }

  getCredentialDefinitionById(credentialDefinitionId: string, orgId: string): Promise<object> {
    const payload = { credentialDefinitionId, orgId }
    return this.natsClient.sendNatsMessage(this.credDefServiceProxy, 'get-credential-definition-by-id', payload)
  }

  getAllCredDefs(
    credDefSearchCriteria: GetAllCredDefsDto,
    user: IUserRequestInterface,
    orgId: string
  ): Promise<ICredDefData> {
    const payload = { credDefSearchCriteria, user, orgId }
    return this.natsClient.sendNatsMessage(this.credDefServiceProxy, 'get-all-credential-definitions', payload)
  }

  getCredentialDefinitionBySchemaId(schemaId: string): Promise<ICredDefs> {
    const payload = { schemaId }
    return this.natsClient.sendNatsMessage(
      this.credDefServiceProxy,
      'get-all-credential-definitions-by-schema-id',
      payload
    )
  }
}
