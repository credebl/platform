import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { Inject, Injectable} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
import { ConnectionDto, CreateOutOfBandConnectionInvitation, ReceiveInvitationDto, ReceiveInvitationUrlDto } from './dtos/connection.dto';
import { IReceiveInvitationRes, IUserRequestInterface } from './interfaces';
import { IConnectionList, IDeletedConnectionsRecord, orgAgents } from '@credebl/common/interfaces/connection.interface';
import { AgentConnectionSearchCriteria, IConnectionDetailsById, IConnectionSearchCriteria } from '../interfaces/IConnectionSearch.interface';
import { BasicMessageDto, QuestionDto } from './dtos/question-answer.dto';
// eslint-disable-next-line camelcase
import { user } from '@prisma/client';
@Injectable()
export class ConnectionService extends BaseService {
  constructor(@Inject('NATS_CLIENT') private readonly connectionServiceProxy: ClientProxy) {
    super('ConnectionService');
  }

  sendQuestion(
    questionDto: QuestionDto
  ): Promise<object> {
    try {
      return this.sendNatsMessage(this.connectionServiceProxy, 'send-question', questionDto);
    } catch (error) {
      throw new RpcException(error.response);
    }
  }

  sendBasicMessage(
    basicMessageDto: BasicMessageDto
  ): Promise<object> {
    try {
      return this.sendNatsMessage(this.connectionServiceProxy, 'send-basic-message-on-connection', basicMessageDto);
    } catch (error) {
      throw new RpcException(error.response);
    }
  }

  getConnectionWebhook(
    connectionDto: ConnectionDto,
    orgId: string
  // eslint-disable-next-line camelcase
  ): Promise<orgAgents> {
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

  getConnectionListFromAgent(
    connectionSearchCriteria: AgentConnectionSearchCriteria,
    orgId: string
  ): Promise<IConnectionList> {
    const payload = { connectionSearchCriteria, orgId };
    return this.sendNatsMessage(this.connectionServiceProxy, 'get-all-agent-connection-list', payload);
  }

  getConnectionsById(
    user: IUserRequest,
    connectionId: string,
    orgId: string
  ): Promise<IConnectionDetailsById> {
    const payload = { user, connectionId, orgId };
    return this.sendNatsMessage(this.connectionServiceProxy, 'get-connection-details-by-connectionId', payload);
  }


  getQuestionAnswersRecord(
    orgId: string
  ): Promise<object> {
    
    return this.sendNatsMessage(this.connectionServiceProxy, 'get-question-answer-record', orgId);
  }

  receiveInvitationUrl(
    receiveInvitationUrl: ReceiveInvitationUrlDto,
    orgId: string,
    user: IUserRequestInterface
  ): Promise<IReceiveInvitationRes> {
    const payload = { user, receiveInvitationUrl, orgId };
    return this.sendNatsMessage(this.connectionServiceProxy, 'receive-invitation-url', payload);
  }

  receiveInvitation(
    receiveInvitation: ReceiveInvitationDto,
    orgId: string,
    user: IUserRequestInterface
  ): Promise<IReceiveInvitationRes> {
    const payload = { user, receiveInvitation, orgId };
    return this.sendNatsMessage(this.connectionServiceProxy, 'receive-invitation', payload);
  }

  async _getWebhookUrl(tenantId?: string, orgId?: string): Promise<string> {
    const pattern = { cmd: 'get-webhookurl' };

    const payload = { tenantId, orgId };
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = await this.connectionServiceProxy.send<any>(pattern, payload).toPromise();
      return message;
    } catch (error) {
      this.logger.error(`catch: ${JSON.stringify(error)}`);
      throw error;
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
      throw error;
    }
  }

  createConnectionInvitation(
    createOutOfBandConnectionInvitation: CreateOutOfBandConnectionInvitation,
    user: IUserRequestInterface
  ): Promise<IReceiveInvitationRes> {
    const payload = { user, createOutOfBandConnectionInvitation };
    return this.sendNatsMessage(this.connectionServiceProxy, 'create-connection-invitation', payload);
  }

  async deleteConnectionRecords(orgId: string, userDetails: user): Promise<IDeletedConnectionsRecord> {
    const payload = { orgId, userDetails };
    return this.sendNatsMessage(this.connectionServiceProxy, 'delete-connection-records', payload);
  }
}
