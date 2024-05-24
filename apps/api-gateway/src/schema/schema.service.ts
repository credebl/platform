import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from '../../../../libs/service/base.service';
import { CreateSchemaDto } from '../dtos/create-schema.dto';
import { ISchemaSearchPayload, W3CSchemaPayload } from '../interfaces/ISchemaSearch.interface';
import { ISchemaInfo, IUserRequestInterface } from './interfaces';
import { ICredDefWithPagination, ISchemaData, ISchemasWithPagination, IW3CSchema } from '@credebl/common/interfaces/schema.interface';
import { GetCredentialDefinitionBySchemaIdDto } from './dtos/get-all-schema.dto';

@Injectable()
export class SchemaService extends BaseService {

  constructor(
    @Inject('NATS_CLIENT') private readonly schemaServiceProxy: ClientProxy
  ) { super(`Schema Service`); }

  createSchema(schema: CreateSchemaDto, user: IUserRequestInterface, orgId: string): Promise<ISchemaData> {
    const payload = { schema, user, orgId };
    return this.sendNatsMessage(this.schemaServiceProxy, 'create-schema', payload);
  }

  createW3CSchema(schemaPayload: W3CSchemaPayload, orgId: string, user: string): Promise<IW3CSchema> {
    const payload = { schemaPayload, orgId, user };
    return this.sendNatsMessage(this.schemaServiceProxy, 'create-w3c-schema', payload);
  }

  getSchemaById(schemaId: string, orgId: string): Promise<ISchemaInfo> {
    const payload = { schemaId, orgId };
    return this.sendNatsMessage(this.schemaServiceProxy, 'get-schema-by-id', payload);
  }

  getSchemas(schemaSearchCriteria: ISchemaSearchPayload, user: IUserRequestInterface, orgId: string): Promise<ISchemasWithPagination> {
    const schemaSearch = { schemaSearchCriteria, user, orgId };
    return this.sendNatsMessage(this.schemaServiceProxy, 'get-schemas', schemaSearch);
  }

  getcredDefListBySchemaId(schemaSearchCriteria: GetCredentialDefinitionBySchemaIdDto, user: IUserRequestInterface): Promise<ICredDefWithPagination> {
    const payload = { schemaSearchCriteria, user };
    return this.sendNatsMessage(this.schemaServiceProxy, 'get-cred-def-list-by-schemas-id', payload);
  }
}