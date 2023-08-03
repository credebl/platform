import { Controller } from '@nestjs/common'; // Import the common service in the library
import { ConnectionService } from './connection.service'; // Import the common service in connection module
import { MessagePattern } from '@nestjs/microservices'; // Import the nestjs microservices package
import { IConnection, IConnectionInterface, IFetchConnectionById, IFetchConnectionInterface } from './interfaces/connection.interfaces';

@Controller()
export class ConnectionController {
  constructor(private readonly connectionService: ConnectionService) { }

  /**
   * Description: Create out-of-band connection legacy invitation
   * @param payload 
   * @returns Created connection invitation for out-of-band
   */
  @MessagePattern({ cmd: 'create-connection' })
  async createLegacyConnectionInvitation(payload: IConnection): Promise<object> {
    const { orgId, user, multiUseInvitation, autoAcceptConnection, alias, imageUrl, label } = payload;
    return this.connectionService.createLegacyConnectionInvitation(orgId, user, multiUseInvitation, autoAcceptConnection, alias, imageUrl, label);
  }

  /**
 * Description: Catch connection webhook responses and save details in connection table
 * @param payload 
 * @returns Callback URL for connection and created connections details
 */
  @MessagePattern({ cmd: 'webhook-get-connection' })
  async getConnectionWebhook(payload: IConnectionInterface): Promise<object> {
    const { createDateTime, lastChangedDateTime, connectionId, state, orgDid, theirLabel, autoAcceptConnection, outOfBandId, orgId } = payload;
    return this.connectionService.getConnectionWebhook(createDateTime, lastChangedDateTime, connectionId, state, orgDid, theirLabel, autoAcceptConnection, outOfBandId, orgId);
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
  async getConnections(payload: IFetchConnectionInterface): Promise<string> {
    const { user, outOfBandId, alias, state, myDid, theirDid, theirLabel, orgId } = payload;
    return this.connectionService.getConnections(user, outOfBandId, alias, state, myDid, theirDid, theirLabel, orgId);
  }

  @MessagePattern({ cmd: 'get-all-connections-by-connectionId' })
  async getConnectionsById(payload: IFetchConnectionById): Promise<string> {
    const { user, connectionId, orgId } = payload;
    return this.connectionService.getConnectionsById(user, connectionId, orgId);
  }
}
