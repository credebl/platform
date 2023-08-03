import { Injectable, Inject, Logger, HttpException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from '../../../../libs/service/base.service';
import { map } from 'rxjs/operators';
import { CredentialListPayload, GetCredentialListByConnectionId, IConnectedHolderList, SortValue } from './platform.interface';
import { ConnectionDto } from '../dtos/connection.dto';
import { credentialSortBy } from '../enum';

@Injectable()
export class PlatformService extends BaseService {
    constructor(
        @Inject('NATS_CLIENT') private readonly platformServiceProxy: ClientProxy
    ) {
        super('PlatformService');
    }


    /**
     * Description: Calling platform service for connection-invitation
     * @param alias 
     * @param auto_accept 
     * @param _public 
     * @param multi_use 
     */
    createConnectionInvitation(alias: string, auto_accept: boolean, _public: boolean, multi_use: boolean) {
        this.logger.log('**** createConnectionInvitation called...');
        const payload = { alias, auto_accept, _public, multi_use };
        return this.sendNats(this.platformServiceProxy, 'default-connection-invitation', payload);
    }

    /**
     * Description: Calling platform service for connection-list
     * @param alias 
     * @param initiator 
     * @param invitation_key 
     * @param my_did 
     * @param state 
     * @param their_did 
     * @param their_role 
     */
    getConnections(alias: string, initiator: string, invitation_key: string, my_did: string, state: string, their_did: string, their_role: string, user: any) {
        this.logger.log('**** getConnections called...');
        const payload = { alias, initiator, invitation_key, my_did, state, their_did, their_role, user };
        return this.sendNats(this.platformServiceProxy, 'connection-list', payload);
    }

    pingServicePlatform() {
        this.logger.log('**** pingServicePlatform called...');
        const payload = {};
        return this.sendNats(this.platformServiceProxy, 'ping-platform', payload);
    }


    connectedHolderList(itemsPerPage: number, page: number, searchText: string, orgId: number, connectionSortBy: string, sortValue: string) {
        this.logger.log('**** connectedHolderList called...');
        const payload: IConnectedHolderList = { itemsPerPage, page, searchText, orgId, connectionSortBy, sortValue };
        return this.sendNats(this.platformServiceProxy, 'connected-holder-list', payload);
    }

    getCredentialListByConnectionId(connectionId: string, items_per_page: number, page: number, search_text: string, sortValue: SortValue, sortBy: credentialSortBy) {
        this.logger.log('**** getCredentialListByConnectionId called...');
        const payload:GetCredentialListByConnectionId = { connectionId, items_per_page, page, search_text, sortValue, sortBy };
        return this.sendNats(this.platformServiceProxy, 'get-credential-by-connection-id', payload);
    }
}
