import { Controller } from '@nestjs/common'; // Import the common service in the library
import { ConnectionService } from './connection.service'; // Import the common service in connection module
import { MessagePattern } from '@nestjs/microservices'; // Import the nestjs microservices package
import {
  IConnection,
  ICreateConnection,
  IFetchConnectionById,
  IFetchConnections,
  IReceiveInvitationByOrg,
  IReceiveInvitationByUrlOrg,
  IReceiveInvitationResponse
} from './interfaces/connection.interfaces';
import { IConnectionList, ICreateConnectionUrl } from '@credebl/common/interfaces/connection.interface';
import { IConnectionDetailsById } from 'apps/api-gateway/src/interfaces/IConnectionSearch.interface';

@Controller()
export class ConnectionController {
  constructor(private readonly connectionService: ConnectionService) {}

  /**
   * Create connection legacy invitation URL
   * @param payload
   * @returns connection invitation URL
   */
  @MessagePattern({ cmd: 'create-connection' })
  async createLegacyConnectionInvitation(payload: IConnection): Promise<ICreateConnectionUrl> {
    return this.connectionService.createLegacyConnectionInvitation(payload);   
  }

  /**
   * Receive connection webhook responses and save details in connection table
   * @param orgId
   * @returns Callback URL for connection and created connections details
   */
  @MessagePattern({ cmd: 'webhook-get-connection' })
  async getConnectionWebhook(payload: ICreateConnection): Promise<object> {
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
  async getConnections(payload: IFetchConnections): Promise<IConnectionList> {
    const { user, orgId, connectionSearchCriteria } = payload;
    return this.connectionService.getConnections(user, orgId, connectionSearchCriteria);
  }

  /**
   * 
   * @param connectionId
   * @param orgId 
   * @returns connection details by connection Id
   */
  @MessagePattern({ cmd: 'get-connection-details-by-connectionId' })
  async getConnectionsById(payload: IFetchConnectionById): Promise<IConnectionDetailsById> {
    const { user, connectionId, orgId } = payload;
    return this.connectionService.getConnectionsById(user, connectionId, orgId);
  }

  @MessagePattern({ cmd: 'receive-invitation-url' })
  async receiveInvitationUrl(payload: IReceiveInvitationByUrlOrg): Promise<IReceiveInvitationResponse> {
    const { user, receiveInvitationUrl, orgId } = payload;
    return this.connectionService.receiveInvitationUrl(user, receiveInvitationUrl, orgId);
  }

  @MessagePattern({ cmd: 'receive-invitation' })
  async receiveInvitation(payload: IReceiveInvitationByOrg): Promise<IReceiveInvitationResponse> {
    const { user, receiveInvitation, orgId } = payload;
    return this.connectionService.receiveInvitation(user, receiveInvitation, orgId);
  }
}
