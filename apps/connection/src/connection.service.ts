/* eslint-disable camelcase */
import { CommonService } from '@credebl/common';
import { CommonConstants } from '@credebl/common/common.constant';
import { HttpException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { map } from 'rxjs';
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
import { OrgAgentType, ConnectionProcessState } from '@credebl/enum/enum';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { IConnectionList, ICreateConnectionUrl, IDeletedConnectionsRecord } from '@credebl/common/interfaces/connection.interface';
import { IConnectionDetailsById } from 'apps/api-gateway/src/interfaces/IConnectionSearch.interface';
import { IBasicMessage, IQuestionPayload } from './interfaces/messaging.interfaces';
import { org_agents, RecordType, user } from '@prisma/client';
import { UserActivityRepository } from 'libs/user-activity/repositories';
import { agent_invitations } from '@prisma/client';
@Injectable()
export class ConnectionService {
  constructor(
    private readonly commonService: CommonService,
    @Inject('NATS_CLIENT') private readonly connectionServiceProxy: ClientProxy,
    private readonly connectionRepository: ConnectionRepository,
    private readonly userActivityRepository: UserActivityRepository,
    private readonly logger: Logger,
    @Inject(CACHE_MANAGER) private cacheService: Cache
  ) {}

  /**
   * Description: Catch connection webhook responses and save details in connection table
   * @param orgId
   * @returns Callback URL for connection and created connections details
   */
  async getConnectionWebhook(payload: ICreateConnection): Promise<org_agents> {
    try {
      const orgAgent = await this.connectionRepository.saveConnectionWebhook(payload);
      return orgAgent;
    } catch (error) {
      this.logger.error(`[getConnectionWebhook] - error in fetch connection webhook: ${error}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   * Store shortening URL
   * @param orgId
   * @returns connection invitation URL
   */
  async _createConnectionInvitation(
    connectionPayload: object,
    url: string,
    orgId: string
  ): Promise<{
    response;
  }> {
    //nats call in agent-service to create an invitation url
    const pattern = { cmd: 'agent-create-connection-legacy-invitation' };
    const payload = { connectionPayload, url, orgId };

    try {
      return await this.natsCall(pattern, payload);
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
      throw new RpcException(error.response ? error.response : error);
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
      throw new RpcException(error.response ? error.response : error);
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

      throw new RpcException(error.response ? error.response : error);
    }
  }

  async getAllConnectionListFromAgent(
    orgId: string,
    connectionSearchCriteria: AgentConnectionSearchCriteria
  ): Promise<string> {
    try {
      const { alias, myDid, outOfBandId, state, theirDid, theirLabel } = connectionSearchCriteria;
      const agentDetails = await this.connectionRepository.getAgentEndPoint(orgId);
      const orgAgentType = await this.connectionRepository.getOrgAgentType(agentDetails?.orgAgentTypeId);
      const { agentEndPoint } = agentDetails;
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }

      let url: string;
      if (orgAgentType === OrgAgentType.DEDICATED) {
        url = `${agentEndPoint}${CommonConstants.URL_CONN_GET_CONNECTIONS}`;
      } else if (orgAgentType === OrgAgentType.SHARED) {
        url = `${agentEndPoint}${CommonConstants.URL_SHAGENT_GET_CREATEED_INVITATIONS}`.replace(
          '#',
          agentDetails.tenantId
        );
      } else {
        throw new NotFoundException(ResponseMessages.connection.error.agentUrlNotFound);
      }

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
      return connectionResponse.response;
    } catch (error) {
      this.logger.error(
        `[getConnectionsFromAgent] [NATS call]- error in fetch connections details : ${JSON.stringify(error)}`
      );

      throw new RpcException(error.response ? error.response : error);
    }
  }

  async _getAllConnections(
    url: string,
    orgId: string
  ): Promise<{
    response: string;
  }> {
    try {
      const pattern = { cmd: 'agent-get-all-connections' };
      const payload = { url, orgId };
      return await this.natsCall(pattern, payload);
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
      const orgAgentType = await this.connectionRepository.getOrgAgentType(agentDetails?.orgAgentTypeId);

      const { agentEndPoint } = agentDetails;
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }

      let url;
      if (orgAgentType === OrgAgentType.DEDICATED) {
        url = `${agentEndPoint}${CommonConstants.URL_CONN_GET_CONNECTION_BY_ID}`.replace('#', connectionId);
      } else if (orgAgentType === OrgAgentType.SHARED) {
        url = `${agentEndPoint}${CommonConstants.URL_SHAGENT_GET_CREATEED_INVITATION_BY_CONNECTIONID}`
          .replace('#', connectionId)
          .replace('@', agentDetails.tenantId);
      } else {
        throw new NotFoundException(ResponseMessages.connection.error.agentUrlNotFound);
      }

      const createConnectionInvitation = await this._getConnectionsByConnectionId(url, orgId);
      return createConnectionInvitation?.response;
    } catch (error) {
      this.logger.error(`[getConnectionsById] - error in get connections : ${JSON.stringify(error)}`);

      if (error?.response?.error?.reason) {
        throw new RpcException({
          message: ResponseMessages.connection.error.connectionNotFound,
          statusCode: error?.response?.status,
          error: error?.response?.error?.reason
        });
      } else {
        throw new RpcException(error.response ? error.response : error);
      }
    }
  }

  async getQuestionAnswersRecord(orgId: string): Promise<object> {
    try {
      const agentDetails = await this.connectionRepository.getAgentEndPoint(orgId);
      const orgAgentType = await this.connectionRepository.getOrgAgentType(agentDetails?.orgAgentTypeId);
      const { agentEndPoint } = agentDetails;
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }

      const label = 'get-question-answer-record';
      const url = await this.getQuestionAnswerAgentUrl(label, orgAgentType, agentEndPoint, agentDetails?.tenantId);

      const record = await this._getQuestionAnswersRecord(url, orgId);
      return record;
    } catch (error) {
      this.logger.error(`[sendQuestion] - error in get question answer record: ${error}`);
      this.handleError(error);
    }
  }

  async _getConnectionsByConnectionId(
    url: string,
    orgId: string
  ): Promise<{
    response;
  }> {
    //nats call in agent service for fetch connection details
    const pattern = { cmd: 'agent-get-connection-details-by-connectionId' };
    const payload = { url, orgId };
    return this.natsCall(pattern, payload);
  }

  async _getQuestionAnswersRecord(url: string, orgId: string): Promise<object> {
    const pattern = { cmd: 'agent-get-question-answer-record' };
    const payload = { url, orgId };
    return this.natsCall(pattern, payload);
  }

  /**
   * Description: Fetch agent url
   * @param referenceId
   * @returns agent URL
   */
  async getAgentUrl(
    orgAgentType: string,
    agentEndPoint: string,
    tenantId?: string,
    connectionInvitationFlag?: string
  ): Promise<string> {
    try {
      let url;
      if ('connection-invitation' === connectionInvitationFlag) {
        if (orgAgentType === OrgAgentType.DEDICATED) {
          url = `${agentEndPoint}${CommonConstants.URL_CONN_INVITE}`;
        } else if (orgAgentType === OrgAgentType.SHARED) {
          url = `${agentEndPoint}${CommonConstants.URL_SHAGENT_CREATE_CONNECTION_INVITATION}`.replace('#', tenantId);
        } else {
          throw new NotFoundException(ResponseMessages.connection.error.agentUrlNotFound);
        }
      } else {
        if (orgAgentType === OrgAgentType.DEDICATED) {
          url = `${agentEndPoint}${CommonConstants.URL_CONN_LEGACY_INVITE}`;
        } else if (orgAgentType === OrgAgentType.SHARED) {
          url = `${agentEndPoint}${CommonConstants.URL_SHAGENT_CREATE_INVITATION}`.replace('#', tenantId);
        } else {
          throw new NotFoundException(ResponseMessages.connection.error.agentUrlNotFound);
        }
      }
      return url;
    } catch (error) {
      this.logger.error(`Error in get agent url: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getQuestionAnswerAgentUrl(
    label: string,
    orgAgentType: string,
    agentEndPoint: string,
    tenantId?: string,
    connectionId?: string
  ): Promise<string> {
    try {
      let url;
      switch (label) {
        case 'send-question': {
          url =
            orgAgentType === OrgAgentType.DEDICATED
              ? `${agentEndPoint}${CommonConstants.URL_SEND_QUESTION}`.replace('#', connectionId)
              : orgAgentType === OrgAgentType.SHARED
              ? `${agentEndPoint}${CommonConstants.URL_SHAGENT_SEND_QUESTION}`
                  .replace('#', connectionId)
                  .replace('@', tenantId)
              : null;
          break;
        }

        case 'get-question-answer-record': {
          url =
            orgAgentType === OrgAgentType.DEDICATED
              ? `${agentEndPoint}${CommonConstants.URL_QUESTION_ANSWER_RECORD}`
              : orgAgentType === OrgAgentType.SHARED
              ? `${agentEndPoint}${CommonConstants.URL_SHAGENT_QUESTION_ANSWER_RECORD}`.replace('#', tenantId)
              : null;
          break;
        }

        default: {
          break;
        }
      }

      if (!url) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentUrlNotFound);
      }

      return url;
    } catch (error) {
      this.logger.error(`Error get question answer agent Url: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async _getOrgAgentApiKey(orgId: string): Promise<{
    response: string;
  }> {
    const pattern = { cmd: 'get-org-agent-api-key' };
    const payload = { orgId };

    try {
      return await this.natsCall(pattern, payload);
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

  async receiveInvitationUrl(
    user: IUserRequest,
    receiveInvitationUrl: IReceiveInvitationUrl,
    orgId: string
  ): Promise<IReceiveInvitationResponse> {
    try {
      const agentDetails = await this.connectionRepository.getAgentEndPoint(orgId);
      const orgAgentType = await this.connectionRepository.getOrgAgentType(agentDetails?.orgAgentTypeId);

      const { agentEndPoint } = agentDetails;
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }

      let url;
      if (orgAgentType === OrgAgentType.DEDICATED) {
        url = `${agentEndPoint}${CommonConstants.URL_RECEIVE_INVITATION_URL}`;
      } else if (orgAgentType === OrgAgentType.SHARED) {
        url = `${agentEndPoint}${CommonConstants.URL_SHAGENT_RECEIVE_INVITATION_URL}`.replace(
          '#',
          agentDetails.tenantId
        );
      } else {
        throw new NotFoundException(ResponseMessages.connection.error.agentUrlNotFound);
      }

      const createConnectionInvitation = await this._receiveInvitationUrl(url, orgId, receiveInvitationUrl);
      return createConnectionInvitation.response;
    } catch (error) {
      this.logger.error(`[receiveInvitationUrl] - error in receive invitation url : ${JSON.stringify(error)}`);

      if (error?.response?.error?.reason) {
        throw new RpcException({
          message: ResponseMessages.connection.error.connectionNotFound,
          statusCode: error?.response?.status,
          error: error?.response?.error?.reason
        });
      } else {
        throw new RpcException(error.response ? error.response : error);
      }
    }
  }

  async _receiveInvitationUrl(
    url: string,
    orgId: string,
    receiveInvitationUrl: IReceiveInvitationUrl
  ): Promise<{
    response;
  }> {
    const pattern = { cmd: 'agent-receive-invitation-url' };
    const payload = { url, orgId, receiveInvitationUrl };
    return this.natsCall(pattern, payload);
  }

  async receiveInvitation(
    user: IUserRequest,
    receiveInvitation: IReceiveInvitation,
    orgId: string
  ): Promise<IReceiveInvitationResponse> {
    try {
      const agentDetails = await this.connectionRepository.getAgentEndPoint(orgId);
      const orgAgentType = await this.connectionRepository.getOrgAgentType(agentDetails?.orgAgentTypeId);

      const { agentEndPoint } = agentDetails;
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }

      let url;
      if (orgAgentType === OrgAgentType.DEDICATED) {
        url = `${agentEndPoint}${CommonConstants.URL_RECEIVE_INVITATION}`;
      } else if (orgAgentType === OrgAgentType.SHARED) {
        url = `${agentEndPoint}${CommonConstants.URL_SHAGENT_RECEIVE_INVITATION}`.replace('#', agentDetails.tenantId);
      } else {
        throw new NotFoundException(ResponseMessages.connection.error.agentUrlNotFound);
      }

      const createConnectionInvitation = await this._receiveInvitation(url, orgId, receiveInvitation);
      return createConnectionInvitation?.response;
    } catch (error) {
      this.logger.error(`[receiveInvitation] - error in receive invitation : ${JSON.stringify(error)}`);

      if (error?.response?.error?.reason) {
        throw new RpcException({
          message: ResponseMessages.connection.error.connectionNotFound,
          statusCode: error?.response?.status,
          error: error?.response?.error?.reason
        });
      } else {
        throw new RpcException(error.response ? error.response : error);
      }
    }
  }

  async _receiveInvitation(
    url: string,
    orgId: string,
    receiveInvitation: IReceiveInvitation
  ): Promise<{
    response;
  }> {
    const pattern = { cmd: 'agent-receive-invitation' };
    const payload = { url, orgId, receiveInvitation };
    return this.natsCall(pattern, payload);
  }

  async _sendQuestion(questionPayload: IQuestionPayload, url: string, orgId: string): Promise<object> {
    const pattern = { cmd: 'agent-send-question' };
    const payload = { questionPayload, url, orgId };
    return this.natsCall(pattern, payload);
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

      const orgAgentType = await this.connectionRepository.getOrgAgentType(agentDetails?.orgAgentTypeId);
      const label = 'send-question';
      const url = await this.getQuestionAnswerAgentUrl(
        label,
        orgAgentType,
        agentEndPoint,
        agentDetails?.tenantId,
        connectionId
      );

      const createQuestion = await this._sendQuestion(questionPayload, url, orgId);
      return createQuestion;
    } catch (error) {
      this.logger.error(`[sendQuestion] - error in sending question: ${error}`);
      if (error && error?.status && error?.status?.message && error?.status?.message?.error) {
        throw new RpcException({
          message: error?.status?.message?.error?.reason
            ? error?.status?.message?.error?.reason
            : error?.status?.message?.error,
          statusCode: error?.status?.code
        });
      } else {
        throw new RpcException(error.response ? error.response : error);
      }
    }
  }

  async storeConnectionObjectAndReturnUrl(connectionInvitationUrl: string, persistent: boolean): Promise<string> {
    const storeObj = connectionInvitationUrl;
    //nats call in agent-service to create an invitation url
    const pattern = { cmd: 'store-object-return-url' };
    const payload = { persistent, storeObj };

    try {
      const message = await this.natsCall(pattern, payload);
      return message.response;
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

      let legacyInvitationDid;
      if (IsReuseConnection) {
        const invitation: agent_invitations = await this.connectionRepository.getInvitationDidByOrgId(orgId);
        legacyInvitationDid = invitation?.invitationDid ?? undefined;
        this.logger.debug('legacyInvitationDid:', legacyInvitationDid);
      }
      const connectionInvitationDid = invitationDid ? invitationDid : legacyInvitationDid;

      this.logger.log('connectionInvitationDid:', connectionInvitationDid);

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

      const createConnectionInvitationFlag = 'connection-invitation';
      const orgAgentType = await this.connectionRepository.getOrgAgentType(agentDetails?.orgAgentTypeId);
      const url = await this.getAgentUrl(
        orgAgentType,
        agentEndPoint,
        agentDetails?.tenantId,
        createConnectionInvitationFlag
      );
      const createConnectionInvitation = await this._createOutOfBandConnectionInvitation(connectionPayload, url, orgId);
      const connectionInvitationUrl = createConnectionInvitation?.response?.invitationUrl;
      const shortenedUrl = await this.storeConnectionObjectAndReturnUrl(
        connectionInvitationUrl,
        connectionPayload.multiUseInvitation
      );

      const invitationsDid = createConnectionInvitation?.response?.invitationDid || invitationDid;
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
        recordId: createConnectionInvitation.response.outOfBandRecord.id,
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
  ): Promise<{
    response;
  }> {
    //nats call in agent-service to create an invitation url
    const pattern = { cmd: 'agent-create-connection-invitation' };
    const payload = { connectionPayload, url, orgId };

    try {
      return await this.natsCall(pattern, payload);
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

  async natsCall(
    pattern: object,
    payload: object
  ): Promise<{
    response: string;
  }> {
    try {
      return this.connectionServiceProxy
        .send(pattern, payload)
        .pipe(
          map((response) => ({
            response
          }))
        )
        .toPromise()
        .catch((error) => {
          this.logger.error(`catch: ${JSON.stringify(error)}`);
          throw new HttpException(
            {
              status: error.statusCode,
              error: error.message
            },
            error.error
          );
        });
    } catch (error) {
      this.logger.error(`[ConnectionService natsCall] - error in nats call : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  handleError(error): Promise<void> {
    if (error && error?.status && error?.status?.message && error?.status?.message?.error) {
      throw new RpcException({
        message: error?.status?.message?.error?.reason
          ? error?.status?.message?.error?.reason
          : error?.status?.message?.error,
        statusCode: error?.status?.code
      });
    } else {
      throw new RpcException(error.response ? error.response : error);
    }
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

        await Promise.all(deleteConnections.getConnectionRecords.map(async (record) => {
            statusCounts[record.state]++;
        }));

        const filteredStatusCounts = Object.fromEntries(
          Object.entries(statusCounts).filter(entry => 0 < entry[1])
        );

        const deletedConnectionData = {
            deletedConnectionsRecordsCount: deleteConnections?.deleteConnectionRecords?.count,
            deletedRecordsStatusCount: filteredStatusCounts
        };

        await this.userActivityRepository._orgDeletedActivity(orgId, user, deletedConnectionData, RecordType.CONNECTION);

        return deleteConnections;

    } catch (error) {
        this.logger.error(`[deleteConnectionRecords] - error in deleting connection records: ${JSON.stringify(error)}`);
        throw new RpcException(error.response ? error.response : error);
    }
  }

 
  async sendBasicMesage(payload: IBasicMessage): Promise<object> {
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

      const organizationAgentType = await this.connectionRepository.getOrgAgentType(agentDetails?.orgAgentTypeId);
      const label = 'send-basic-message';
      const agentUrl = await this.commonService.sendBasicMessageAgentUrl(
        label,
        organizationAgentType,
        agentEndPoint,
        agentDetails?.tenantId,
        connectionId
      );

      const sendBasicMessage = await this._sendBasicMessageToAgent(questionPayload, agentUrl, orgId);
      return sendBasicMessage;
    } catch (error) {
      this.logger.error(`[sendBasicMesage] - error in send basic message: ${error}`);
      if (error && error?.status && error?.status?.message && error?.status?.message?.error) {
        throw new RpcException({
          message: error?.status?.message?.error?.reason
            ? error?.status?.message?.error?.reason
            : error?.status?.message?.error,
          statusCode: error?.status?.code
        });
      } else {
        throw new RpcException(error.response ? error.response : error);
      }
    }
  }

  async _sendBasicMessageToAgent(content: IBasicMessage, url: string, orgId: string): Promise<object> {
    const pattern = { cmd: 'agent-send-basic-message' };
    const payload = { content, url, orgId };
    // eslint-disable-next-line no-return-await
    return await this.natsCall(pattern, payload);
  }

}
