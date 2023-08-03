import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
import { ConnectionDto, CreateConnectionDto } from './dtos/connection.dto';
import { IUserRequestInterface } from './interfaces';


@Injectable()
export class ConnectionService extends BaseService {
    constructor(
        @Inject('NATS_CLIENT') private readonly connectionServiceProxy: ClientProxy
    ) {
        super('ConnectionService');
    }

    createLegacyConnectionInvitation(connectionDto: CreateConnectionDto, user: IUserRequestInterface): Promise<{
        response: object;
    }> {
        try {
            const connectionDetails = { orgId: connectionDto.orgId, alias: connectionDto.alias, label: connectionDto.label, imageUrl: connectionDto.imageUrl, multiUseInvitation: connectionDto.multiUseInvitation, autoAcceptConnection: connectionDto.autoAcceptConnection, user };
            return this.sendNats(this.connectionServiceProxy, 'create-connection', connectionDetails);
        } catch (error) {
            throw new RpcException(error.response);

        }
    }

    getConnectionWebhook(connectionDto: ConnectionDto, id: number): Promise<{
        response: object;
    }> {
        const payload = { connectionId: connectionDto.id, state: connectionDto.state, orgDid: connectionDto.theirDid, theirLabel: connectionDto.theirLabel, autoAcceptConnection: connectionDto.autoAcceptConnection, outOfBandId: connectionDto.outOfBandId, createDateTime: connectionDto.createdAt, lastChangedDateTime: connectionDto.updatedAt, orgId: id };
        return this.sendNats(this.connectionServiceProxy, 'webhook-get-connection', payload);
    }

    getUrl(referenceId: string): Promise<{
        response: object;
    }> {
        try {
            const connectionDetails = { referenceId };
            return this.sendNats(this.connectionServiceProxy, 'get-connection-url', connectionDetails);
        } catch (error) {
            throw new RpcException(error.response);

        }
    }

    getConnections(user: IUserRequest, outOfBandId: string, alias: string, state: string, myDid: string, theirDid: string, theirLabel: string, orgId: number): Promise<{
        response: object;
    }> {
        const payload = { user, outOfBandId, alias, state, myDid, theirDid, theirLabel, orgId };
        return this.sendNats(this.connectionServiceProxy, 'get-all-connections', payload);
    }

    getConnectionsById(user: IUserRequest, connectionId: string, orgId: number): Promise<{
        response: object;
    }> {
        const payload = { user, connectionId, orgId };
        return this.sendNats(this.connectionServiceProxy, 'get-all-connections-by-connectionId', payload);
    }
}