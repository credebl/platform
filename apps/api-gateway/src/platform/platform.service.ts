import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from '../../../../libs/service/base.service';
import { ISchemaSearchPayload } from '../interfaces/ISchemaSearch.interface';
import { IUserRequestInterface } from '../interfaces/IUserRequestInterface';

@Injectable()
export class PlatformService extends BaseService {
    constructor(
        @Inject('NATS_CLIENT') private readonly platformServiceProxy: ClientProxy
    ) {
        super('PlatformService');
    }

    async getAllSchema(schemaSearchCriteria: ISchemaSearchPayload, user: IUserRequestInterface): Promise<{
        response: object;
    }> {
        const schemaSearch = { schemaSearchCriteria, user };
        return this.sendNats(this.platformServiceProxy, 'get-all-schemas', schemaSearch);

    }

    async getAllLedgers(): Promise<{
        response: object;
    }> {
        const payload = {};
        return this.sendNats(this.platformServiceProxy, 'get-all-ledgers', payload);
    }

    async getNetworkUrl(indyNamespace: string): Promise<{
        response: object;
    }> {
        const payload = {
            indyNamespace
        };
        return this.sendNats(this.platformServiceProxy, 'get-network-url', payload);
    }
}
