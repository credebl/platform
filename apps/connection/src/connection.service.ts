/* eslint-disable camelcase */
import { CommonService } from '@credebl/common';
import { CommonConstants } from '@credebl/common/common.constant';
import { HttpException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { map } from 'rxjs';
import {
  IConnection,
  IConnectionInvitation,
  IConnectionSearchCriteria,
  ICreateConnection,
  IReceiveInvitation,
  IReceiveInvitationResponse,
  IReceiveInvitationUrl
} from './interfaces/connection.interfaces';
import { ConnectionRepository } from './connection.repository';
import { ResponseMessages } from '@credebl/common/response-messages';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { OrgAgentType } from '@credebl/enum/enum';
// import { platform_config } from '@prisma/client';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { IConnectionList, ICreateConnectionUrl } from '@credebl/common/interfaces/connection.interface';
import { IConnectionDetailsById } from 'apps/api-gateway/src/interfaces/IConnectionSearch.interface';
import { IQuestionPayload } from './interfaces/question-answer.interfaces';

@Injectable()
export class ConnectionService {
  constructor(
    private readonly commonService: CommonService,
    @Inject('NATS_CLIENT') private readonly connectionServiceProxy: ClientProxy,
    private readonly connectionRepository: ConnectionRepository,
    private readonly logger: Logger,
    @Inject(CACHE_MANAGER) private cacheService: Cache
  ) {}

  /**
   * Create connection legacy invitation URL
   * @param orgId
   * @param user
   * @returns Connection legacy invitation URL
   */
  async createLegacyConnectionInvitation(payload: IConnection): Promise<ICreateConnectionUrl> {
    const {
      orgId,
      multiUseInvitation,
      autoAcceptConnection,
      alias,
      imageUrl,
      goal,
      goalCode,
      handshake,
      handshakeProtocols
    } = payload;
    try {
      const agentDetails = await this.connectionRepository.getAgentEndPoint(orgId);

      const { agentEndPoint, id, organisation } = agentDetails;
      const agentId = id;
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.connection.error.agentEndPointNotFound);
      }

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
        handshakeProtocols: handshakeProtocols || undefined
      };

      const orgAgentType = await this.connectionRepository.getOrgAgentType(agentDetails?.orgAgentTypeId);
      const url = await this.getAgentUrl(orgAgentType, agentEndPoint, agentDetails?.tenantId);

      const apiKey = await this._getOrgAgentApiKey(orgId);

      const createConnectionInvitation = await this._createConnectionInvitation(connectionPayload, url, apiKey);
      const connectionInvitaion = createConnectionInvitation?.message?.invitation;
      const shortenedUrl = await this.storeObjectAndReturnUrl(
        connectionInvitaion,
        connectionPayload.multiUseInvitation
      );
      Logger.verbose('This is Invitation object::::::', createConnectionInvitation?.message?.invitation);

      const saveConnectionDetails = await this.connectionRepository.saveAgentConnectionInvitations(
        shortenedUrl,
        agentId,
        orgId
      );
      return saveConnectionDetails;
    } catch (error) {
      this.logger.error(`[createLegacyConnectionInvitation] - error in connection invitation: ${error}`);
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
    apiKey: string
  ): Promise<IConnectionInvitation> {
    //nats call in agent-service to create an invitation url
    const pattern = { cmd: 'agent-create-connection-legacy-invitation' };
    const payload = { connectionPayload, url, apiKey };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = await this.connectionServiceProxy.send<any>(pattern, payload).toPromise();
      return { message };
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
      const agentDetails = await this.connectionRepository.getAgentEndPoint(orgId);
      const orgAgentType = await this.connectionRepository.getOrgAgentType(agentDetails?.orgAgentTypeId);
      // const platformConfig: platform_config = await this.connectionRepository.getPlatformConfigDetails();

      const { agentEndPoint } = agentDetails;
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const params = {
        outOfBandId,
        alias,
        state,
        myDid,
        theirDid,
        theirLabel
      };
      return connectionResponse;
    } catch (error) {
      this.logger.error(`[getConnections] [NATS call]- error in fetch connections details : ${JSON.stringify(error)}`);

      throw new RpcException(error.response ? error.response : error);
    }
  }

  async _getAllConnections(
    url: string,
    apiKey: string
  ): Promise<{
    response: string;
  }> {
    try {
      const pattern = { cmd: 'agent-get-all-connections' };
      const payload = { url, apiKey };
      return this.connectionServiceProxy
        .send<string>(pattern, payload)
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
      // const platformConfig: platform_config = await this.connectionRepository.getPlatformConfigDetails();

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

      // const apiKey = await this._getOrgAgentApiKey(orgId);
      let apiKey: string = await this.cacheService.get(CommonConstants.CACHE_APIKEY_KEY);
      if (!apiKey || null === apiKey || undefined === apiKey) {
        apiKey = await this._getOrgAgentApiKey(orgId);
      }
      const createConnectionInvitation = await this._getConnectionsByConnectionId(url, apiKey);
      return createConnectionInvitation;
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

  async getQuestionAnswersRecord(tenantId: string, orgId: string): Promise<object> {
    try {
      const agentDetails = await this.connectionRepository.getAgentEndPoint(orgId);
      const orgAgentType = await this.connectionRepository.getOrgAgentType(agentDetails?.orgAgentTypeId);
      const { agentEndPoint } = agentDetails;
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }

      const label = 'get-question-answer-record';
      const url = await this.getQuestionAnswerAgentUrl(label, orgAgentType, agentEndPoint, agentDetails?.tenantId);
      
      let apiKey: string = await this.cacheService.get(CommonConstants.CACHE_APIKEY_KEY);
      if (!apiKey || null === apiKey || undefined === apiKey) {
        apiKey = await this._getOrgAgentApiKey(orgId);
      }
      const record = await this._getQuestionAnswersRecord(url, apiKey);
      return record;


    } catch (error) {
      this.logger.error(`[sendQuestion] - error in get question answer record: ${error}`);
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

  async _getConnectionsByConnectionId(
    url: string,
    apiKey: string
  ): Promise<IConnectionDetailsById> {

    //nats call in agent service for fetch connection details
    const pattern = { cmd: 'agent-get-connection-details-by-connectionId' };
    const payload = { url, apiKey };
    return this.connectionServiceProxy
      .send<IConnectionDetailsById>(pattern, payload)
      .toPromise()
      .catch((error) => {
        this.logger.error(
          `[_getConnectionsByConnectionId] [NATS call]- error in fetch connections : ${JSON.stringify(error)}`
        );
        throw new HttpException(
          {
            status: error.statusCode,
            error: error.error?.message?.error ? error.error?.message?.error : error.error,
            message: error.message
          },
          error.error
        );
      });
  }

  async _getQuestionAnswersRecord(
    url: string,
    apiKey: string
  ): Promise<object> {

    const pattern = { cmd: 'agent-get-question-answer-record' };
    const payload = { url, apiKey };
    return this.connectionServiceProxy
      .send<IConnectionDetailsById>(pattern, payload)
      .toPromise()
      .catch(error => {
        this.logger.error(
          `[_getQuestionAnswersRecord] [NATS call]- error in fetch connections : ${JSON.stringify(error)}`
        );
        throw new HttpException(
          {
            status: error.statusCode,
            error: error.error?.message?.error ? error.error?.message?.error : error.error,
            message: error.message
          }, error.error);
      });
  }

  /**
   * Description: Fetch agent url
   * @param referenceId
   * @returns agent URL
   */
  async getAgentUrl(orgAgentType: string, agentEndPoint: string, tenantId?: string): Promise<string> {
    try {
      let url;
      if (orgAgentType === OrgAgentType.DEDICATED) {
        url = `${agentEndPoint}${CommonConstants.URL_CONN_LEGACY_INVITE}`;
      } else if (orgAgentType === OrgAgentType.SHARED) {
        url = `${agentEndPoint}${CommonConstants.URL_SHAGENT_CREATE_INVITATION}`.replace('#', tenantId);
      } else {
        throw new NotFoundException(ResponseMessages.connection.error.agentUrlNotFound);
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
    tenantId: string,
    connectionId?: string
  ): Promise<string> {
    try {

      let url;
      switch (label) {
        case 'send-question': {
          url = orgAgentType === OrgAgentType.DEDICATED
              ? `${agentEndPoint}${CommonConstants.URL_SEND_QUESTION}`.replace('#', connectionId)
              : orgAgentType === OrgAgentType.SHARED
              ? `${agentEndPoint}${CommonConstants.URL_SHAGENT_SEND_QUESTION}`.replace('#', connectionId).replace('@', tenantId)
              : null;
          break;
        }

        case 'get-question-answer-record': {
          url = orgAgentType === OrgAgentType.DEDICATED
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

  async _getOrgAgentApiKey(orgId: string): Promise<string> {
    const pattern = { cmd: 'get-org-agent-api-key' };
    const payload = { orgId };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = await this.connectionServiceProxy.send<any>(pattern, payload).toPromise();
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

      let apiKey: string = await this.cacheService.get(CommonConstants.CACHE_APIKEY_KEY);
      if (!apiKey || null === apiKey || undefined === apiKey) {
        apiKey = await this._getOrgAgentApiKey(orgId);
      }
      const createConnectionInvitation = await this._receiveInvitationUrl(url, apiKey, receiveInvitationUrl);
      return createConnectionInvitation;
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
    apiKey: string,
    receiveInvitationUrl: IReceiveInvitationUrl
  ): Promise<IReceiveInvitationResponse> {
    const pattern = { cmd: 'agent-receive-invitation-url' };
    const payload = { url, apiKey, receiveInvitationUrl };
    return this.connectionServiceProxy
      .send<IReceiveInvitationResponse>(pattern, payload)
      .toPromise()
      .catch((error) => {
        this.logger.error(
          `[_receiveInvitationUrl] [NATS call]- error in receive invitation url : ${JSON.stringify(error)}`
        );
        throw new HttpException(
          {
            status: error.statusCode,
            error: error.error?.message?.error ? error.error?.message?.error : error.error,
            message: error.message
          },
          error.error
        );
      });
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

      let apiKey: string = await this.cacheService.get(CommonConstants.CACHE_APIKEY_KEY);
      if (!apiKey || null === apiKey || undefined === apiKey) {
        apiKey = await this._getOrgAgentApiKey(orgId);
      }
      const createConnectionInvitation = await this._receiveInvitation(url, apiKey, receiveInvitation);
      return createConnectionInvitation;
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
    apiKey: string,
    receiveInvitation: IReceiveInvitation
  ): Promise<IReceiveInvitationResponse> {
    const pattern = { cmd: 'agent-receive-invitation' };
    const payload = { url, apiKey, receiveInvitation };
    return this.connectionServiceProxy
      .send<IReceiveInvitationResponse>(pattern, payload)
      .toPromise()
      .catch((error) => {
        this.logger.error(`[_receiveInvitation] [NATS call]- error in receive invitation : ${JSON.stringify(error)}`);
        throw new HttpException(
          {
            status: error.statusCode,
            error: error.error?.message?.error ? error.error?.message?.error : error.error,
            message: error.message
          },
          error.error
        );
      });
  }

  async storeObjectAndReturnUrl(connectionInvitation, persistent: boolean): Promise<string> {
    const utilityRequestBodyString = JSON.stringify({ data: connectionInvitation });
    const storeObj = JSON.parse(utilityRequestBodyString);

    //nats call in agent-service to create an invitation url
    const pattern = { cmd: 'store-object-return-url' };
    const payload = { persistent, storeObj };

    try {
      const message = await this.connectionServiceProxy
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .send<any>(pattern, payload)
        .toPromise()
        .catch((error) => {
          this.logger.error(
            `[storeObjectAndReturnUrl] [NATS call]- error in storing object and returning url : ${JSON.stringify(
              error
            )}`
          );
          throw new HttpException(
            {
              status: error.statusCode,
              error: error.error?.message?.error ? error.error?.message?.error : error.error,
              message: error.message
            },
            error.error
          );
        });
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
}
