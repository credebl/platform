import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { GenericSchemaDTO } from '../dtos/create-schema.dto';
import { ISchemaSearchPayload } from '../interfaces/ISchemaSearch.interface';
import { ISchemaInfo, IUserRequestSelectedOrgsInterface } from './interfaces';
import { ICredDefWithPagination, ISchemaData, ISchemasWithPagination, BaseService } from '@credebl/common';
import { GetCredentialDefinitionBySchemaIdDto } from './dtos/get-all-schema.dto';
import { NATSClient, UpdateSchemaResponse } from '@credebl/common';

import { UpdateSchemaDto } from './dtos/update-schema-dto';

@Injectable()
export class SchemaService extends BaseService {
  constructor(
    @Inject('NATS_CLIENT') private readonly schemaServiceProxy: ClientProxy,
    private readonly natsClient: NATSClient
  ) {
    super(`Schema Service`);
  }

  createSchema(
    schemaDetails: GenericSchemaDTO,
    user: IUserRequestSelectedOrgsInterface,
    orgId: string
  ): Promise<ISchemaData> {
    const payload = { schemaDetails, user, orgId };
    return this.natsClient.sendNatsMessage(this.schemaServiceProxy, 'create-schema', payload);
  }

  getSchemaById(schemaId: string, orgId: string): Promise<ISchemaInfo> {
    const payload = { schemaId, orgId };
    return this.natsClient.sendNatsMessage(this.schemaServiceProxy, 'get-schema-by-id', payload);
  }

  getSchemas(
    schemaSearchCriteria: ISchemaSearchPayload,
    user: IUserRequestSelectedOrgsInterface,
    orgId: string
  ): Promise<ISchemasWithPagination> {
    const schemaSearch = { schemaSearchCriteria, user, orgId };
    return this.natsClient.sendNatsMessage(this.schemaServiceProxy, 'get-schemas', schemaSearch);
  }

  getcredDefListBySchemaId(
    schemaSearchCriteria: GetCredentialDefinitionBySchemaIdDto,
    user: IUserRequestSelectedOrgsInterface
  ): Promise<ICredDefWithPagination> {
    const payload = { schemaSearchCriteria, user };
    return this.natsClient.sendNatsMessage(this.schemaServiceProxy, 'get-cred-def-list-by-schemas-id', payload);
  }

  updateSchema(schemaDetails: UpdateSchemaDto): Promise<UpdateSchemaResponse> {
    const payload = { schemaDetails };
    return this.natsClient.sendNatsMessage(this.schemaServiceProxy, 'update-schema', payload);
  }
}
