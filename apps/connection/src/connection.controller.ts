import { Controller } from '@nestjs/common'; // Import the common service in the library
import { ConnectionService } from './connection.service'; // Import the common service in connection module
import { MessagePattern } from '@nestjs/microservices'; // Import the nestjs microservices package
import {
  ConnectionList,
  FetchConnectionInterface,
  IConnection,
  IConnectionInterface,
  IFetchConnectionById
} from './interfaces/connection.interfaces';

@Controller()
export class ConnectionController {
  constructor(private readonly connectionService: ConnectionService) {}

  /**
   * Description: Create out-of-band connection legacy invitation
   * @param payload
   * @returns Created connection invitation for out-of-band
   */
  @MessagePattern({ cmd: 'create-connection' })
  async createLegacyConnectionInvitation(payload: IConnection): Promise<object> {
    const { orgId, user, multiUseInvitation, autoAcceptConnection, alias, imageUrl, label } = payload;

    return this.connectionService.createLegacyConnectionInvitation(
      orgId,
      user,
      multiUseInvitation,
      autoAcceptConnection,
      alias,
      imageUrl,
      label
    );
  }

  /**
   * Description: Catch connection webhook responses and save details in connection table
   * @param payload
   * @returns Callback URL for connection and created connections details
   */
  @MessagePattern({ cmd: 'webhook-get-connection' })
  async getConnectionWebhook(payload: IConnectionInterface): Promise<object> {
    return this.connectionService.getConnectionWebhook(payload);
  }

  /**
   * Description: Fetch connection url by refernceId.
   * @param payload
   * @returns Created connection invitation for out-of-band
   */
  @MessagePattern({ cmd: 'get-connection-url' })
  async getUrl(payload: { referenceId }): Promise<string> {
    return this.connectionService.getUrl(payload.referenceId);
  }

  @MessagePattern({ cmd: 'get-all-connections' })
  async getConnections(payload: FetchConnectionInterface): Promise<ConnectionList> {
    const { user, orgId, connectionSearchCriteria } = payload;
    return this.connectionService.getConnections(user, orgId, connectionSearchCriteria);
  }

  @MessagePattern({ cmd: 'get-all-connections-by-connectionId' })
  async getConnectionsById(payload: IFetchConnectionById): Promise<string> {
    const { user, connectionId, orgId } = payload;
    return this.connectionService.getConnectionsById(user, connectionId, orgId);
  }
}
