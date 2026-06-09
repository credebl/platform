import { IUserRequest } from '@credebl/user-management';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import {
  ConnectionDto,
  CreateOutOfBandConnectionInvitation,
  ReceiveInvitationDto,
  ReceiveInvitationUrlDto
} from './dtos/connection.dto';
import { IConnectionList, IDeletedConnectionsRecord } from '@credebl/common/interfaces/connection.interface';
import { AgentConnectionSearchCriteria, IConnectionDetailsById, IConnectionSearchCriteria } from './interfaces';
import { BasicMessageDto, QuestionDto } from './dtos/question-answer.dto';
import { IUserRequestInterface, IReceiveInvitationResponse } from './interfaces';
import { user } from '@prisma/client';
import { NATSClient } from '@credebl/common/NATSClient';
import { firstValueFrom } from 'rxjs';
import { IWebhookUrlInfo } from '@credebl/common/interfaces/webhook.interface';

@Injectable()
export class ConnectionService {
  protected logger = new Logger('ConnectionService');

  constructor(
    @Inject('NATS_CLIENT') private readonly connectionServiceProxy: ClientProxy,
    private readonly natsClient: NATSClient
  ) {}

  sendQuestion(questionDto: QuestionDto): Promise<object> {
    try {
      return this.natsClient.sendNatsMessage(this.connectionServiceProxy, 'send-question', questionDto);
    } catch (error) {
      throw new RpcException(error?.response ?? error);
    }
  }

  sendBasicMessage(basicMessageDto: BasicMessageDto): Promise<object> {
    try {
      return this.natsClient.sendNatsMessage(
        this.connectionServiceProxy,
        'send-basic-message-on-connection',
        basicMessageDto
      );
    } catch (error) {
      throw new RpcException(error?.response ?? error);
    }
  }

  getConnectionWebhook(connectionDto: ConnectionDto, orgId: string): Promise<object> {
    const payload = { connectionDto, orgId };
    return this.natsClient.sendNatsMessage(this.connectionServiceProxy, 'webhook-get-connection', payload);
  }

  getUrl(referenceId: string): Promise<{ response: object }> {
    try {
      const connectionDetails = { referenceId };
      return this.natsClient.sendNats(this.connectionServiceProxy, 'get-connection-url', connectionDetails);
    } catch (error) {
      throw new RpcException(error?.response ?? error);
    }
  }

  getConnections(
    connectionSearchCriteria: IConnectionSearchCriteria,
    user: IUserRequest,
    orgId: string
  ): Promise<IConnectionList> {
    const payload = { connectionSearchCriteria, user, orgId };
    return this.natsClient.sendNatsMessage(this.connectionServiceProxy, 'get-all-connections', payload);
  }

  getConnectionListFromAgent(
    connectionSearchCriteria: AgentConnectionSearchCriteria,
    orgId: string
  ): Promise<IConnectionList> {
    const payload = { connectionSearchCriteria, orgId };
    return this.natsClient.sendNatsMessage(this.connectionServiceProxy, 'get-all-agent-connection-list', payload);
  }

  getConnectionsById(user: IUserRequest, connectionId: string, orgId: string): Promise<IConnectionDetailsById> {
    const payload = { user, connectionId, orgId };
    return this.natsClient.sendNatsMessage(
      this.connectionServiceProxy,
      'get-connection-details-by-connectionId',
      payload
    );
  }

  getQuestionAnswersRecord(orgId: string): Promise<object> {
    return this.natsClient.sendNatsMessage(this.connectionServiceProxy, 'get-question-answer-record', orgId);
  }

  receiveInvitationUrl(
    receiveInvitationUrl: ReceiveInvitationUrlDto,
    orgId: string,
    user: IUserRequestInterface
  ): Promise<IReceiveInvitationResponse> {
    const payload = { user, receiveInvitationUrl, orgId };
    return this.natsClient.sendNatsMessage(this.connectionServiceProxy, 'receive-invitation-url', payload);
  }

  receiveInvitation(
    receiveInvitation: ReceiveInvitationDto,
    orgId: string,
    user: IUserRequestInterface
  ): Promise<IReceiveInvitationResponse> {
    const payload = { user, receiveInvitation, orgId };
    return this.natsClient.sendNatsMessage(this.connectionServiceProxy, 'receive-invitation', payload);
  }

  async _getWebhookUrl(tenantId?: string, orgId?: string): Promise<IWebhookUrlInfo> {
    const pattern = { cmd: 'get-webhookurl' };
    const payload = { tenantId, orgId };
    try {
      const message: IWebhookUrlInfo = await firstValueFrom(this.connectionServiceProxy.send(pattern, payload));
      return message;
    } catch (error) {
      this.logger.error(`catch: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async _postWebhookResponse(webhookUrl: string, data: object, webhookSecret?: string): Promise<string> {
    const pattern = { cmd: 'post-webhook-response-to-webhook-url' };
    const payload = { webhookUrl, data, webhookSecret };
    try {
      const message: string = await firstValueFrom(this.connectionServiceProxy.send(pattern, payload));
      return message;
    } catch (error) {
      this.logger.error(`catch: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  createConnectionInvitation(
    createOutOfBandConnectionInvitation: CreateOutOfBandConnectionInvitation,
    user: IUserRequestInterface
  ): Promise<IReceiveInvitationResponse> {
    const payload = { user, createOutOfBandConnectionInvitation };
    return this.natsClient.sendNatsMessage(this.connectionServiceProxy, 'create-connection-invitation', payload);
  }

  async deleteConnectionRecords(orgId: string, userDetails: user): Promise<IDeletedConnectionsRecord> {
    const payload = { orgId, userDetails };
    return this.natsClient.sendNatsMessage(this.connectionServiceProxy, 'delete-connection-records', payload);
  }
}
