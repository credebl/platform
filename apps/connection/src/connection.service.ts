/* eslint-disable camelcase */
import { CommonService } from '@credebl/common';
import { CommonConstants } from '@credebl/common/common.constant';
import { HttpException, HttpStatus, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import {
  ConnectionResponseDetail,
  AgentConnectionSearchCriteria,
  IConnectionSearchCriteria,
  ICreateConnection,
  IReceiveInvitation,
  IReceiveInvitationResponse,
  IReceiveInvitationUrl,
  ICreateOutOfbandConnectionInvitation,
  ICreateConnectionInvitation
} from './interfaces/connection.interfaces';
import { ConnectionRepository } from './connection.repository';
import { ResponseMessages } from '@credebl/common/response-messages';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { ConnectionProcessState } from '@credebl/enum/enum';
import {
  IConnectionList,
  ICreateConnectionUrl,
  IDeletedConnectionsRecord
} from '@credebl/common/interfaces/connection.interface';
import { IConnectionDetailsById } from 'apps/api-gateway/src/interfaces/IConnectionSearch.interface';
import { IBasicMessage, IQuestionPayload } from './interfaces/messaging.interfaces';
import { RecordType, user } from '@prisma/client';
import { UserActivityRepository } from 'libs/user-activity/repositories';
import { agent_invitations } from '@prisma/client';
import { NATSClient } from '@credebl/common/NATSClient';
import { getAgentUrl } from '@credebl/common/common.utils';
@Injectable()
export class ConnectionService {
  constructor(
    private readonly commonService: CommonService,
    @Inject('NATS_CLIENT') private readonly connectionServiceProxy: ClientProxy,
    private readonly connectionRepository: ConnectionRepository,
    private readonly userActivityRepository: UserActivityRepository,
    private readonly logger: Logger,
    private readonly natsClient: NATSClient
  ) {}

  /**
   * Description: Catch connection webhook responses and save details in connection table
   * @param orgId
   * @returns Callback URL for connection and created connections details
   */
  async getConnectionWebhook(payload: ICreateConnection): Promise<object> {
    try {
      const saveConnectionDetails = await this.connectionRepository.saveConnectionWebhook(payload);
      return saveConnectionDetails;
    } catch (error) {
      this.logger.error(`[getConnectionWebhook] - error in fetch connection webhook: ${error}`);
      throw new RpcException(error?.response ?? error);
    }
  }

  /**
   * Store shortening URL
   * @param orgId
   * @returns connection invitation URL
   */
  async _createConnectionInvitation(connectionPayload: object, url: string, orgId: string): Promise<unknown> {
    //nats call in agent-service to create an invitation url
    const pattern = { cmd: 'agent-create-connection-legacy-invitation' };
    const payload = { connectionPayload, url, orgId };

    try {
      const result = await this.natsClient.send(this.connectionServiceProxy, pattern, payload);
      return result;
    } catch (error) {
      this.logger.error(`catch: ${JSON.stringify(error)}`);
      throw new HttpException(
        {
          status: error.status,
          error: error.message
        },
        error.status
      );
    }
  }

  async storeShorteningUrl(referenceId: string): Promise<object> {
    try {
      return this.connectionRepository.storeShorteningUrl(referenceId);
    } catch (error) {
      this.logger.error(`Error in store agent details : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getConnectionRecords(orgId: string): Promise<number> {
    try {
      return await this.connectionRepository.getConnectionRecordsCount(orgId);
    } catch (error) {
      this.logger.error(
        `[getConnectionRecords ] [NATS call]- error in get connection records count : ${JSON.stringify(error)}`
      );
      throw new RpcException(error?.response ?? error);
    }
  }

  /**
   * Description: Fetch connection invitaion by referenceId
   * @param referenceId
   * @returns Connection legacy invitation URL
   */
  async getUrl(referenceId: string): Promise<string> {
    try {
      const urlDetails = await this.connectionRepository.getShorteningUrl(referenceId);
      return urlDetails.referenceId;
    } catch (error) {
      this.logger.error(`Error in get url in connection service: ${JSON.stringify(error)}`);
      throw new RpcException(error?.response ?? error);
    }
  }

  /**
   * Description: Fetch all connections
   * @param orgId
   * @param user
   *
   * @returns get all connections details
   */
  async getConnections(
    user: IUserRequest,
    orgId: string,
    connectionSearchCriteria: IConnectionSearchCriteria
  ): Promise<IConnectionList> {
    try {
      const getConnectionList = await this.connectionRepository.getAllConnections(
        user,
        orgId,
        connectionSearchCriteria
      );

      if (0 === getConnectionList.connectionCount) {
        throw new NotFoundException(ResponseMessages.connection.error.connectionNotFound);
      }

      const connectionResponse: {
        totalItems: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        nextPage: number;
        previousPage: number;
        lastPage: number;
        data: {
          createDateTime: Date;
          createdBy: string;
          connectionId: string;
          theirLabel: string;
          state: string;
          orgId: string;
        }[];
      } = {
        totalItems: getConnectionList.connectionCount,
        hasNextPage:
          connectionSearchCriteria.pageSize * connectionSearchCriteria.pageNumber < getConnectionList.connectionCount,
        hasPreviousPage: 1 < connectionSearchCriteria.pageNumber,
        nextPage: Number(connectionSearchCriteria.pageNumber) + 1,
        previousPage: connectionSearchCriteria.pageNumber - 1,
        lastPage: Math.ceil(getConnectionList.connectionCount / connectionSearchCriteria.pageSize),
        data: getConnectionList.connectionsList
      };
      return connectionResponse;
    } catch (error) {
      this.logger.error(`[getConnections] [NATS call]- error in fetch connections details : ${JSON.stringify(error)}`);

      throw new RpcException(error?.response ?? error);
    }
  }

  async getAllConnectionListFromAgent(
    orgId: string,
    connectionSearchCriteria: AgentConnectionSearchCriteria
  ): Promise<IConnectionList> {
    try {
      const { alias, myDid, outOfBandId, state, theirDid, theirLabel } = connectionSearchCriteria;
      const agentDetails = await this.connectionRepository.getAgentEndPoint(orgId);
      const { agentEndPoint } = agentDetails;
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }

      let url: string;
      url = `${agentEndPoint}${CommonConstants.URL_CONN_GET_CONNECTIONS}`;

      //Create the dynamic URL for Search Criteria
      const criteriaParams = [];
      if (alias) {
        criteriaParams.push(`alias=${alias}`);
      }
      if (myDid) {
        criteriaParams.push(`myDid=${myDid}`);
      }
      if (outOfBandId) {
        criteriaParams.push(`outOfBandId=${outOfBandId}`);
      }
      if (state) {
        criteriaParams.push(`state=${state}`);
      }
      if (theirDid) {
        criteriaParams.push(`theirDid=${theirDid}`);
      }
      if (theirLabel) {
        criteriaParams.push(`theirLabel=${theirLabel}`);
      }

      if (0 < criteriaParams.length) {
        url += `?${criteriaParams.join('&')}`;
      }

      const connectionResponse = await this._getAllConnections(url, orgId);
      return connectionResponse;
    } catch (error) {
      this.logger.error(
        `[getConnectionsFromAgent] [NATS call]- error in fetch connections details : ${JSON.stringify(error)}`
      );

      throw new RpcException(error);
    }
  }

  async _getAllConnections(url: string, orgId: string): Promise<IConnectionList> {
    try {
      const pattern = { cmd: 'agent-get-all-connections' };
      const payload = { url, orgId };
      const result = await this.natsClient.send<IConnectionList>(this.connectionServiceProxy, pattern, payload);
      return result;
    } catch (error) {
      this.logger.error(
        `[_getAllConnections] [NATS call]- error in fetch connections details : ${JSON.stringify(error)}`
      );
      throw error;
    }
  }

  async getConnectionsById(user: IUserRequest, connectionId: string, orgId: string): Promise<IConnectionDetailsById> {
    try {
      const agentDetails = await this.connectionRepository.getAgentEndPoint(orgId);
      const { agentEndPoint } = agentDetails;
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const url = `${agentEndPoint}${CommonConstants.URL_CONN_GET_CONNECTION_BY_ID}`.replace('#', connectionId);
      const createConnectionInvitation = await this._getConnectionsByConnectionId(url, orgId);
      return createConnectionInvitation;
    } catch (error) {
      this.logger.error(`[getConnectionsById] - error in get connections : ${JSON.stringify(error)}`);

      if (error?.error?.reason) {
        throw new RpcException({
          message: ResponseMessages.connection.error.connectionNotFound,
          statusCode: error?.status,
          error: error?.error?.reason
        });
      } else {
        throw new RpcException(error);
      }
    }
  }

  async getQuestionAnswersRecord(orgId: string): Promise<object> {
    try {
      const agentDetails = await this.connectionRepository.getAgentEndPoint(orgId);
      const { agentEndPoint } = agentDetails;
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const url = getAgentUrl(agentEndPoint, CommonConstants.GET_QUESTION_ANSWER_RECORD);

      const record = await this._getQuestionAnswersRecord(url, orgId);
      return record;
    } catch (error) {
      this.logger.error(`[sendQuestion] - error in get question answer record: ${error}`);
      this.handleError(error);
    }
  }

  async _getConnectionsByConnectionId(url: string, orgId: string): Promise<IConnectionDetailsById> {
    //nats call in agent service for fetch connection details
    const pattern = { cmd: 'agent-get-connection-details-by-connectionId' };
    const payload = { url, orgId };
    return this.natsClient.send<IConnectionDetailsById>(this.connectionServiceProxy, pattern, payload);
  }

  async _getQuestionAnswersRecord(url: string, orgId: string): Promise<object> {
    try {
      const pattern = { cmd: 'agent-get-question-answer-record' };
      const payload = { url, orgId };
      const result = await this.natsClient.send<object>(this.connectionServiceProxy, pattern, payload);
      return result;
    } catch (error) {
      this.logger.error(
        `[_getQuestionAnswersRecord ] [NATS call]- error in get question and answer records : ${JSON.stringify(error)}`
      );
      throw error;
    }
  }

  async receiveInvitationUrl(
    user: IUserRequest,
    receiveInvitationUrl: IReceiveInvitationUrl,
    orgId: string
  ): Promise<IReceiveInvitationResponse> {
    try {
      const agentDetails = await this.connectionRepository.getAgentEndPoint(orgId);
      const { agentEndPoint } = agentDetails;
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const url = `${agentEndPoint}${CommonConstants.URL_RECEIVE_INVITATION_URL}`;
      const createConnectionInvitation = await this._receiveInvitationUrl(url, orgId, receiveInvitationUrl);
      return createConnectionInvitation;
    } catch (error) {
      this.logger.error(`[receiveInvitationUrl] - error in receive invitation url : ${JSON.stringify(error, null, 2)}`);

      const customErrorMessage = error?.status?.message?.error?.message;
      if (customErrorMessage) {
        throw new RpcException({
          statusCode: HttpStatus.CONFLICT,
          message: customErrorMessage,
          error: ResponseMessages.errorMessages.conflict
        });
      } else if (error?.error?.reason) {
        throw new RpcException({
          message: ResponseMessages.connection.error.connectionNotFound,
          statusCode: error?.status,
          error: error?.error?.reason
        });
      } else {
        throw new RpcException(error?.response ?? error);
      }
    }
  }

  async _receiveInvitationUrl(
    url: string,
    orgId: string,
    receiveInvitationUrl: IReceiveInvitationUrl
  ): Promise<IReceiveInvitationResponse> {
    const pattern = { cmd: 'agent-receive-invitation-url' };
    const payload = { url, orgId, receiveInvitationUrl };

    try {
      const result = await this.natsClient.send<IReceiveInvitationResponse>(
        this.connectionServiceProxy,
        pattern,
        payload
      );
      return result;
    } catch (error) {
      this.logger.error(`catch: ${JSON.stringify(error)}`);
      throw new HttpException(
        {
          status: error.status,
          error: error.message
        },
        error.status
      );
    }
  }

  async receiveInvitation(
    user: IUserRequest,
    receiveInvitation: IReceiveInvitation,
    orgId: string
  ): Promise<IReceiveInvitationResponse> {
    try {
      const agentDetails = await this.connectionRepository.getAgentEndPoint(orgId);
      const { agentEndPoint } = agentDetails;
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const url = `${agentEndPoint}${CommonConstants.URL_RECEIVE_INVITATION}`;
      const createConnectionInvitation = await this._receiveInvitation(url, orgId, receiveInvitation);
      return createConnectionInvitation;
    } catch (error) {
      this.logger.error(`[receiveInvitation] - error in receive invitation : ${JSON.stringify(error)}`);

      if (error?.error?.reason) {
        throw new RpcException({
          message: ResponseMessages.connection.error.connectionNotFound,
          statusCode: error?.status,
          error: error?.error?.reason
        });
      } else {
        throw new RpcException(error?.response ?? error);
      }
    }
  }

  async _receiveInvitation(
    url: string,
    orgId: string,
    receiveInvitation: IReceiveInvitation
  ): Promise<IReceiveInvitationResponse> {
    const pattern = { cmd: 'agent-receive-invitation' };
    const payload = { url, orgId, receiveInvitation };
    return this.natsClient.send(this.connectionServiceProxy, pattern, payload);
  }

  async _sendQuestion(questionPayload: IQuestionPayload, url: string, orgId: string): Promise<object> {
    const pattern = { cmd: 'agent-send-question' };
    const payload = { questionPayload, url, orgId };
    return this.natsClient.send(this.connectionServiceProxy, pattern, payload);
  }

  async sendQuestion(payload: IQuestionPayload): Promise<object> {
    const { detail, validResponses, question, orgId, connectionId } = payload;
    try {
      const agentDetails = await this.connectionRepository.getAgentEndPoint(orgId);

      const { agentEndPoint } = agentDetails;

      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.connection.error.agentEndPointNotFound);
      }

      const questionPayload = {
        detail,
        validResponses,
        question
      };

      const url = getAgentUrl(agentEndPoint, CommonConstants.SEND_QUESTION, connectionId);

      const createQuestion = await this._sendQuestion(questionPayload, url, orgId);
      return createQuestion;
    } catch (error) {
      this.logger.error(`[sendQuestion] - error in sending question: ${error}`);
      if (error?.status?.message?.error) {
        throw new RpcException({
          message: error.status.message.error.reason || error.status.message.error,
          statusCode: error.status?.code ?? HttpStatus.INTERNAL_SERVER_ERROR
        });
      }
      throw new RpcException(error?.response ?? error);
    }
  }

  async storeConnectionObjectAndReturnUrl(connectionInvitationUrl: string, persistent: boolean): Promise<string> {
    const storeObj = connectionInvitationUrl;
    //nats call in agent-service to create an invitation url
    const pattern = { cmd: 'store-object-return-url' };
    const payload = { persistent, storeObj };

    try {
      const message = await this.natsClient.send<string>(this.connectionServiceProxy, pattern, payload);
      return message;
    } catch (error) {
      this.logger.error(`catch: ${JSON.stringify(error)}`);
      throw new HttpException(
        {
          status: error.status,
          error: error.message
        },
        error.status
      );
    }
  }

  /**
   * Create connection invitation URL
   * @param orgId
   * @param user
   * @returns Connection invitation URL
   */
  async createConnectionInvitation(payload: ICreateOutOfbandConnectionInvitation): Promise<ICreateConnectionUrl> {
    try {
      const {
        alias,
        appendedAttachments,
        autoAcceptConnection,
        goal,
        goalCode,
        handshake,
        handshakeProtocols,
        imageUrl,
        messages,
        multiUseInvitation,
        orgId,
        routing,
        recipientKey,
        invitationDid,
        IsReuseConnection
      } = payload?.createOutOfBandConnectionInvitation;

      const agentDetails = await this.connectionRepository.getAgentEndPoint(
        payload?.createOutOfBandConnectionInvitation?.orgId
      );

      const { agentEndPoint, id, organisation } = agentDetails;
      const agentId = id;
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.connection.error.agentEndPointNotFound);
      }

      let legacyinvitationDid;
      if (IsReuseConnection) {
        const data: agent_invitations[] = await this.connectionRepository.getInvitationDidByOrgId(orgId);
        if (data && 0 < data.length) {
          const [firstElement] = data;
          legacyinvitationDid = firstElement?.invitationDid ?? undefined;

          this.logger.log('legacyinvitationDid:', legacyinvitationDid);
        }
      }
      const connectionInvitationDid = invitationDid ? invitationDid : legacyinvitationDid;

      this.logger.log('connectionInvitationDid:', connectionInvitationDid);

      this.logger.log(`logoUrl:::, ${organisation.logoUrl}`);
      const connectionPayload = {
        multiUseInvitation: multiUseInvitation ?? true,
        autoAcceptConnection: autoAcceptConnection ?? true,
        alias: alias || undefined,
        imageUrl: organisation.logoUrl || imageUrl || undefined,
        label: organisation.name,
        goal: goal || undefined,
        goalCode: goalCode || undefined,
        handshake: handshake || undefined,
        handshakeProtocols: handshakeProtocols || undefined,
        appendedAttachments: appendedAttachments || undefined,
        routing: routing || undefined,
        messages: messages || undefined,
        recipientKey: recipientKey || undefined,
        invitationDid: connectionInvitationDid || undefined
      };
      const url = getAgentUrl(agentEndPoint, CommonConstants.CONNECTION_INVITATION);
      const createConnectionInvitation = await this._createOutOfBandConnectionInvitation(connectionPayload, url, orgId);
      const connectionInvitationUrl = createConnectionInvitation?.invitationUrl;
      const shortenedUrl = await this.storeConnectionObjectAndReturnUrl(
        connectionInvitationUrl,
        connectionPayload.multiUseInvitation
      );

      const invitationsDid = createConnectionInvitation?.invitationDid || invitationDid;
      const saveConnectionDetails = await this.connectionRepository.saveAgentConnectionInvitations(
        shortenedUrl,
        agentId,
        orgId,
        invitationsDid
      );
      const connectionStorePayload: ConnectionResponseDetail = {
        id: saveConnectionDetails.id,
        orgId: saveConnectionDetails.orgId,
        agentId: saveConnectionDetails.agentId,
        connectionInvitation: saveConnectionDetails.connectionInvitation,
        multiUse: saveConnectionDetails.multiUse,
        createDateTime: saveConnectionDetails.createDateTime,
        createdBy: saveConnectionDetails.createdBy,
        lastChangedDateTime: saveConnectionDetails.lastChangedDateTime,
        lastChangedBy: saveConnectionDetails.lastChangedBy,
        recordId: createConnectionInvitation.outOfBandRecord.id,
        invitationDid: saveConnectionDetails.invitationDid
      };
      return connectionStorePayload;
    } catch (error) {
      this.logger.error(`[createConnectionInvitation] - error in connection oob invitation: ${error}`);
      this.handleError(error);
    }
  }

  /**
   * Store shortening URL
   * @param orgId
   * @returns connection invitation URL
   */
  async _createOutOfBandConnectionInvitation(
    connectionPayload: ICreateConnectionInvitation,
    url: string,
    orgId: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    //nats call in agent-service to create an invitation url
    const pattern = { cmd: 'agent-create-connection-invitation' };
    const payload = { connectionPayload, url, orgId };

    try {
      const result = await this.natsClient.send(this.connectionServiceProxy, pattern, payload);
      return result;
    } catch (error) {
      this.logger.error(`catch: ${JSON.stringify(error)}`);
      throw new HttpException(
        {
          status: error.status,
          error: error.message
        },
        error.status
      );
    }
  }

  handleError(error): Promise<void> {
    if (error?.status?.message?.error) {
      throw new RpcException({
        message: error.status.message.error.reason || error.status.message.error,
        statusCode: error.status?.code ?? HttpStatus.INTERNAL_SERVER_ERROR
      });
    }
    throw new RpcException(error?.response ?? error);
  }

  async deleteConnectionRecords(orgId: string, user: user): Promise<IDeletedConnectionsRecord> {
    try {
      const deleteConnections = await this.connectionRepository.deleteConnectionRecordsByOrgId(orgId);

      if (0 === deleteConnections?.deleteConnectionRecords?.count) {
        throw new NotFoundException(ResponseMessages.connection.error.connectionRecordNotFound);
      }

      const statusCounts = {
        [ConnectionProcessState.START]: 0,
        [ConnectionProcessState.COMPLETE]: 0,
        [ConnectionProcessState.ABANDONED]: 0,
        [ConnectionProcessState.INVITATION_SENT]: 0,
        [ConnectionProcessState.INVITATION_RECEIVED]: 0,
        [ConnectionProcessState.REQUEST_SENT]: 0,
        [ConnectionProcessState.DECLIEND]: 0,
        [ConnectionProcessState.REQUEST_RECEIVED]: 0,
        [ConnectionProcessState.RESPONSE_SENT]: 0,
        [ConnectionProcessState.RESPONSE_RECEIVED]: 0
      };

      await Promise.all(
        deleteConnections.getConnectionRecords.map(async (record) => {
          statusCounts[record.state]++;
        })
      );

      const filteredStatusCounts = Object.fromEntries(Object.entries(statusCounts).filter((entry) => 0 < entry[1]));

      const deletedConnectionData = {
        deletedConnectionsRecordsCount: deleteConnections?.deleteConnectionRecords?.count,
        deletedRecordsStatusCount: filteredStatusCounts
      };

      await this.userActivityRepository._orgDeletedActivity(orgId, user, deletedConnectionData, RecordType.CONNECTION);

      return deleteConnections;
    } catch (error) {
      this.logger.error(`[deleteConnectionRecords] - error in deleting connection records: ${JSON.stringify(error)}`);
      throw new RpcException(error?.response ?? error);
    }
  }

  async sendBasicMessage(payload: IBasicMessage): Promise<object> {
    const { content, orgId, connectionId } = payload;
    try {
      const agentDetails = await this.connectionRepository.getAgentEndPoint(orgId);

      const { agentEndPoint } = agentDetails;

      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.connection.error.agentEndPointNotFound);
      }

      const questionPayload = {
        content
      };
      const agentUrl = getAgentUrl(agentEndPoint, CommonConstants.SEND_BASIC_MESSAGE, connectionId);

      const sendBasicMessage = await this._sendBasicMessageToAgent(questionPayload, agentUrl, orgId);
      return sendBasicMessage;
    } catch (error) {
      this.logger.error(`[sendBasicMesage] - error in send basic message: ${error}`);
      if (error?.status?.message?.error) {
        throw new RpcException({
          message: error.status.message.error.reason || error.status.message.error,
          statusCode: error.status?.code ?? HttpStatus.INTERNAL_SERVER_ERROR
        });
      }
      throw new RpcException(error?.response ?? error);
    }
  }

  async _sendBasicMessageToAgent(content: IBasicMessage, url: string, orgId: string): Promise<object> {
    const pattern = { cmd: 'agent-send-basic-message' };
    const payload = { content, url, orgId };
    return this.natsClient.send(this.connectionServiceProxy, pattern, payload);
  }
}
