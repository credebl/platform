import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { BaseService } from '../../../../libs/service/base.service';
import { CreateSchemaDto } from '../dtos/create-schema.dto';
import { ICredDeffSchemaSearchInterface, ISchemaSearchInterface } from '../interfaces/ISchemaSearch.interface';
import { IUserRequestInterface } from './interfaces';

@Injectable()
export class SchemaService extends BaseService {

  constructor(
    @Inject('NATS_CLIENT') private readonly schemaServiceProxy: ClientProxy
  ) { super(`Schema Service`); }

  createSchema(schema: CreateSchemaDto, user: IUserRequestInterface, orgId: number): Promise<{
    response: object;
  }> {
    try {
      const payload = { schema, user, orgId };
      return this.sendNats(this.schemaServiceProxy, 'create-schema', payload);
    } catch (error) {
      throw new RpcException(error.response);

    }
  }

  getSchemaById(schemaId: string, orgId: number): Promise<{
    response: object;
  }> {
    try {
      const payload = { schemaId, orgId };
      return this.sendNats(this.schemaServiceProxy, 'get-schema-by-id', payload);
    } catch (error) {
      throw new RpcException(error.response);

    }
  }

  getSchemas(schemaSearchCriteria: ISchemaSearchInterface, user: IUserRequestInterface, orgId: number): Promise<{
    response: object;
  }> {
    try {
      const schemaSearch = { schemaSearchCriteria, user, orgId };
      return this.sendNats(this.schemaServiceProxy, 'get-schemas', schemaSearch);
    } catch (error) {
      throw new RpcException(error.response);

    }
  }

  getcredDeffListBySchemaId(schemaId: string, schemaSearchCriteria: ICredDeffSchemaSearchInterface, user: IUserRequestInterface, orgId: number): Promise<{
    response: object;
  }> {
    try {
      const payload = { schemaId, schemaSearchCriteria, user, orgId };
      return this.sendNats(this.schemaServiceProxy, 'get-cred-deff-list-by-schemas-id', payload);
    } catch (error) {
      throw new RpcException(error.response);

    }
  }
}