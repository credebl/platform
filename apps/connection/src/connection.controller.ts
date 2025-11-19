import { Controller } from '@nestjs/common'; // Import the common service in the library
import { ConnectionService } from './connection.service'; // Import the common service in connection module
import { MessagePattern } from '@nestjs/microservices'; // Import the nestjs microservices package
import {
  GetAllConnections,
  ICreateConnection,
  ICreateOutOfbandConnectionInvitation,
  IFetchConnectionById,
  IFetchConnections,
  IReceiveInvitationByOrg,
  IReceiveInvitationByUrlOrg,
  IReceiveInvitationResponse
} from './interfaces/connection.interfaces';
import { IConnectionList, IDeletedConnectionsRecord, orgAgents } from '@credebl/common/interfaces/connection.interface';
import { IConnectionDetailsById } from 'apps/api-gateway/src/interfaces/IConnectionSearch.interface';
import { IQuestionPayload } from './interfaces/messaging.interfaces';
// eslint-disable-next-line camelcase
import { user } from '@prisma/client';
@Controller()
export class ConnectionController {
  constructor(private readonly connectionService: ConnectionService) {}

  /**
   * Receive connection webhook responses and save details in connection table
   * @param orgId
   * @returns Callback URL for connection and created connections details
   */
  @MessagePattern({ cmd: 'webhook-get-connection' })
  // eslint-disable-next-line camelcase
  async getConnectionWebhook(payload: ICreateConnection): Promise<orgAgents> {
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

  @MessagePattern({ cmd: 'get-all-agent-connection-list' })
  async getConnectionListFromAgent(payload: GetAllConnections): Promise<string> {
    const {orgId, connectionSearchCriteria } = payload;
    return this.connectionService.getAllConnectionListFromAgent(orgId, connectionSearchCriteria);
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

  @MessagePattern({ cmd: 'get-connection-records' })
  async getConnectionRecordsByOrgId(payload: { orgId: string, userId: string }): Promise<number> {
    const { orgId } = payload;
    return this.connectionService.getConnectionRecords(orgId);
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
  
  @MessagePattern({ cmd: 'send-question' })
  async sendQuestion(payload: IQuestionPayload): Promise<object> {
    return this.connectionService.sendQuestion(payload);
  }

  @MessagePattern({ cmd: 'get-question-answer-record' })
  async getQuestionAnswersRecord(orgId: string): Promise<object> {
    return this.connectionService.getQuestionAnswersRecord(orgId);
  }

  @MessagePattern({ cmd: 'create-connection-invitation' })
  async createConnectionInvitation(payload: ICreateOutOfbandConnectionInvitation): Promise<object> {
    return this.connectionService.createConnectionInvitation(payload);
  }

  @MessagePattern({ cmd: 'delete-connection-records' })
  async deleteConnectionRecords(payload: {orgId: string, userDetails: user}): Promise<IDeletedConnectionsRecord> {  
    const { orgId, userDetails } = payload;
    return this.connectionService.deleteConnectionRecords(orgId, userDetails);
  }

  @MessagePattern({ cmd: 'send-basic-message-on-connection' })
  async sendBasicMessage(payload: {content: string, orgId: string, connectionId: string}): Promise<object> {
    return this.connectionService.sendBasicMesage(payload);
  }
}
