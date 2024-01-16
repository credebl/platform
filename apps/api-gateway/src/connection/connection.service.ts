import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { Inject, Injectable, HttpException } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
import { ConnectionDto, CreateConnectionDto } from './dtos/connection.dto';
import { IUserRequestInterface } from './interfaces';
import { IConnectionList, ICreateConnectionUrl } from '@credebl/common/interfaces/connection.interface';
import { IConnectionDetailsById, IConnectionSearchCriteria } from '../interfaces/IConnectionSearch.interface';

@Injectable()
export class ConnectionService extends BaseService {
  constructor(@Inject('NATS_CLIENT') private readonly connectionServiceProxy: ClientProxy) {
    super('ConnectionService');
  }

  createLegacyConnectionInvitation(
    connectionDto: CreateConnectionDto,
    user: IUserRequestInterface
  ): Promise<ICreateConnectionUrl> {
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

      return this.sendNatsMessage(this.connectionServiceProxy, 'create-connection', connectionDetails);
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
    return this.sendNatsMessage(this.connectionServiceProxy, 'get-connection-details-by-connectionId', payload);
  }


  async _getWebhookUrl(tenantId: string): Promise<string> {
    const pattern = { cmd: 'get-webhookurl' };
    const payload = { tenantId };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = await this.connectionServiceProxy.send<any>(pattern, payload).toPromise();
      return message;
    } catch (error) {
      this.logger.error(`catch: ${JSON.stringify(error)}`);
      throw new HttpException({
        status: error.status,
        error: error.message
      }, error.status);
    }
  }

  async _postWebhookResponse(webhookUrl: string, data:object): Promise<string> {
    const pattern = { cmd: 'post-webhook-response-to-webhook-url' };
    const payload = { webhookUrl, data  };
   
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = await this.connectionServiceProxy.send<any>(pattern, payload).toPromise();
      return message;
    } catch (error) {
      this.logger.error(`catch: ${JSON.stringify(error)}`);
      throw new HttpException({
        status: error.status,
        error: error.message
      }, error.status);
    }
  }

}
