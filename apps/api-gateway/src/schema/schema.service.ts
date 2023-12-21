import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from '../../../../libs/service/base.service';
import { CreateSchemaDto } from '../dtos/create-schema.dto';
import { ICredDeffSchemaSearchInterface, ISchemaSearchInterface } from '../interfaces/ISchemaSearch.interface';
import { IUserRequestInterface } from './interfaces';

@Injectable()
export class SchemaService extends BaseService {

  constructor(
    @Inject('NATS_CLIENT') private readonly schemaServiceProxy: ClientProxy
  ) { super(`Schema Service`); }

  createSchema(schema: CreateSchemaDto, user: IUserRequestInterface, orgId: string): Promise<{
    response: string;
  }> {
    const payload = { schema, user, orgId };
    return this.sendNats(this.schemaServiceProxy, 'create-schema', payload);
  }

  getSchemaById(schemaId: string, orgId: string): Promise<{
    response: object;
  }> {
    const payload = { schemaId, orgId };
    return this.sendNats(this.schemaServiceProxy, 'get-schema-by-id', payload);
  }

  getSchemas(schemaSearchCriteria: ISchemaSearchInterface, user: IUserRequestInterface, orgId: string): Promise<{
    response: object;
  }> {
    const schemaSearch = { schemaSearchCriteria, user, orgId };
    return this.sendNats(this.schemaServiceProxy, 'get-schemas', schemaSearch);
  }

  getcredDeffListBySchemaId(schemaId: string, schemaSearchCriteria: ICredDeffSchemaSearchInterface, user: IUserRequestInterface, orgId: string): Promise<{
    response: object;
  }> {
    const payload = { schemaId, schemaSearchCriteria, user, orgId };
    return this.sendNats(this.schemaServiceProxy, 'get-cred-deff-list-by-schemas-id', payload);
  }
}