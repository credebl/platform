import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from '../../../../libs/service/base.service';
import { ILedgers, ISchemaSearchPayload } from '../interfaces/ISchemaSearch.interface';
import { IUserRequestInterface } from '../interfaces/IUserRequestInterface';
import { INetworkUrl, ISchemaDetails } from '@credebl/common/interfaces/schema.interface';
import { GetAllPlatformCredDefsDto } from '../credential-definition/dto/get-all-platform-cred-defs.dto';
import { IPlatformCredDefsData } from '@credebl/common/interfaces/cred-def.interface';

@Injectable()
export class PlatformService extends BaseService {
    constructor(
        @Inject('NATS_CLIENT') private readonly platformServiceProxy: ClientProxy
    ) {
        super('PlatformService');
    }

    async getAllSchema(schemaSearchCriteria: ISchemaSearchPayload, user: IUserRequestInterface): Promise<ISchemaDetails> {
        const schemaSearch = { schemaSearchCriteria, user };
        return this.sendNatsMessage(this.platformServiceProxy, 'get-all-schemas', schemaSearch);

    }

    async getAllPlatformCredDefs(getAllPlatformCredDefs: GetAllPlatformCredDefsDto, user: IUserRequestInterface): Promise<IPlatformCredDefsData> {
        const credDefs = { ...getAllPlatformCredDefs, user };
        return this.sendNatsMessage(this.platformServiceProxy, 'get-all-platform-cred-defs', credDefs);
    }

    async getAllLedgers(): Promise<ILedgers> {
        const payload = {};
        return this.sendNatsMessage(this.platformServiceProxy, 'get-all-ledgers', payload);
    }

    async getNetworkUrl(indyNamespace: string): Promise<INetworkUrl> {
        return this.sendNatsMessage(this.platformServiceProxy, 'get-network-url', indyNamespace);
    }

    async getShorteningUrlById(referenceId: string): Promise<string> {
    
        // NATS call
        return this.sendNatsMessage(this.platformServiceProxy, 'get-shortening-url', referenceId);
      }
}