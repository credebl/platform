import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { BaseService } from '../../../../libs/service/base.service';
import { ISchemaSearchInterface } from '../interfaces/ISchemaSearch.interface';
import { IUserRequestInterface } from '../interfaces/IUserRequestInterface';

@Injectable()
export class PlatformService extends BaseService {
    constructor(
        @Inject('NATS_CLIENT') private readonly platformServiceProxy: ClientProxy
    ) {
        super('PlatformService');
    }

    getAllSchema(schemaSearchCriteria: ISchemaSearchInterface, user: IUserRequestInterface): Promise<{
        response: object;
      }> {
        try {
          const schemaSearch = { schemaSearchCriteria, user };
          return this.sendNats(this.platformServiceProxy, 'get-all-schemas', schemaSearch);
        } catch (error) {
          throw new RpcException(error.response);
    
        }
      }
}
