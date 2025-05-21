import type { NATSClient } from '@credebl/common/NATSClient'
import type {
  ICredDefWithPagination,
  ISchemaData,
  ISchemasWithPagination,
} from '@credebl/common/interfaces/schema.interface'
import { Inject, Injectable } from '@nestjs/common'
import type { ClientProxy } from '@nestjs/microservices'
import { BaseService } from '../../../../libs/service/base.service'
import type { GenericSchemaDTO } from '../dtos/create-schema.dto'
import type { ISchemaSearchPayload } from '../interfaces/ISchemaSearch.interface'
import type { GetCredentialDefinitionBySchemaIdDto } from './dtos/get-all-schema.dto'
import type { ISchemaInfo, IUserRequestInterface } from './interfaces'

import type { UpdateSchemaResponse } from 'apps/ledger/src/schema/interfaces/schema.interface'
import type { UpdateSchemaDto } from './dtos/update-schema-dto'

@Injectable()
export class SchemaService extends BaseService {
  constructor(
    @Inject('NATS_CLIENT') private readonly schemaServiceProxy: ClientProxy,
    private readonly natsClient: NATSClient
  ) {
    super('Schema Service')
  }

  createSchema(schemaDetails: GenericSchemaDTO, user: IUserRequestInterface, orgId: string): Promise<ISchemaData> {
    const payload = { schemaDetails, user, orgId }
    return this.natsClient.sendNatsMessage(this.schemaServiceProxy, 'create-schema', payload)
  }

  getSchemaById(schemaId: string, orgId: string): Promise<ISchemaInfo> {
    const payload = { schemaId, orgId }
    return this.natsClient.sendNatsMessage(this.schemaServiceProxy, 'get-schema-by-id', payload)
  }

  getSchemas(
    schemaSearchCriteria: ISchemaSearchPayload,
    user: IUserRequestInterface,
    orgId: string
  ): Promise<ISchemasWithPagination> {
    const schemaSearch = { schemaSearchCriteria, user, orgId }
    return this.natsClient.sendNatsMessage(this.schemaServiceProxy, 'get-schemas', schemaSearch)
  }

  getcredDefListBySchemaId(
    schemaSearchCriteria: GetCredentialDefinitionBySchemaIdDto,
    user: IUserRequestInterface
  ): Promise<ICredDefWithPagination> {
    const payload = { schemaSearchCriteria, user }
    return this.natsClient.sendNatsMessage(this.schemaServiceProxy, 'get-cred-def-list-by-schemas-id', payload)
  }

  updateSchema(schemaDetails: UpdateSchemaDto): Promise<UpdateSchemaResponse> {
    const payload = { schemaDetails }
    return this.natsClient.sendNatsMessage(this.schemaServiceProxy, 'update-schema', payload)
  }
}
