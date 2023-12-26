import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
import { ConnectionDto, CreateConnectionDto } from './dtos/connection.dto';
import { IUserRequestInterface } from './interfaces';
import { IConnectionDetailsById, IConnectionSearchinterface } from '../interfaces/ISchemaSearch.interface';

@Injectable()
export class ConnectionService extends BaseService {
  constructor(@Inject('NATS_CLIENT') private readonly connectionServiceProxy: ClientProxy) {
    super('ConnectionService');
  }

  createLegacyConnectionInvitation(
    connectionDto: CreateConnectionDto,
    user: IUserRequestInterface
  ): Promise<{
    response: object;
  }> {
    try {
      const connectionDetails = {
        orgId: connectionDto.orgId,
        alias: connectionDto.alias,
        label: connectionDto.label,
        imageUrl: connectionDto.imageUrl,
        multiUseInvitation: connectionDto.multiUseInvitation,
        autoAcceptConnection: connectionDto.autoAcceptConnection,
        user
      };

      return this.sendNats(this.connectionServiceProxy, 'create-connection', connectionDetails);
    } catch (error) {
      throw new RpcException(error.response);
    }
  }

  getConnectionWebhook(
    connectionDto: ConnectionDto,
    orgId: string
  ): Promise<object> {
    const payload = { connectionDto, orgId };
    return this.sendNatsMessage(this.connectionServiceProxy, 'webhook-get-connection', payload);
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

  getConnections(
    connectionSearchCriteria: IConnectionSearchCriteria,
    user: IUserRequest,
    orgId: string
  ): Promise<IConnectionList> {
    const payload = { connectionSearchCriteria, user, orgId };
    return this.sendNatsMessage(this.connectionServiceProxy, 'get-all-connections', payload);
  }

  getConnectionsById(
    user: IUserRequest,
    connectionId: string,
    orgId: string
  ): Promise<IConnectionDetailsById> {
    const payload = { user, connectionId, orgId };
    return this.sendNatsMessage(this.connectionServiceProxy, 'get-all-connection-details-by-connectionId', payload);
  }
}
