/* eslint-disable camelcase */
import { CommonService } from '@credebl/common';
import { CommonConstants } from '@credebl/common/common.constant';
import {
  HttpException,
  Inject,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import {
  ClientProxy,
  RpcException
} from '@nestjs/microservices';
import { map } from 'rxjs';
import {
  ConnectionInvitationResponse,
  IUserRequestInterface
} from './interfaces/connection.interfaces';
import { ConnectionRepository } from './connection.repository';
import { ResponseMessages } from '@credebl/common/response-messages';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { OrgAgentType } from '@credebl/enum/enum';
import { platform_config } from '@prisma/client';


@Injectable()
export class ConnectionService {

  constructor(
    private readonly commonService: CommonService,
    @Inject('NATS_CLIENT') private readonly connectionServiceProxy: ClientProxy,
    private readonly connectionRepository: ConnectionRepository,
    private readonly logger: Logger
  ) { }

  /**
   * Description: create connection legacy invitation 
   * @param orgId 
   * @param user 
   * @returns Connection legacy invitation URL
   */
  async createLegacyConnectionInvitation(
    orgId: number, user: IUserRequestInterface, multiUseInvitation: boolean, autoAcceptConnection: boolean, alias: string, imageUrl: string, label: string
  ): Promise<object> {
    try {
      const agentDetails = await this.connectionRepository.getAgentEndPoint(orgId);
      const platformConfig: platform_config = await this.connectionRepository.getPlatformConfigDetails();
      const { agentEndPoint, id, organisation } = agentDetails;
      const agentId = id;
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.connection.error.agentEndPointNotFound);
      }

      let logoImageUrl;
      if (organisation.logoUrl) {
        logoImageUrl = `${process.env.API_GATEWAY_PROTOCOL}://${process.env.API_ENDPOINT}/orgs/profile/${organisation.id}`;
      }

      this.logger.log(`logoImageUrl ::: ${logoImageUrl}`);
      const connectionPayload = {
        multiUseInvitation: multiUseInvitation || true,
        autoAcceptConnection: autoAcceptConnection || true,
        alias: alias || undefined,
        imageUrl: logoImageUrl ? logoImageUrl : '',
        label: label || undefined
      };

      const url = await this.getAgentUrl(agentDetails?.orgAgentTypeId, agentEndPoint, agentDetails?.tenantId);

      const apiKey = platformConfig?.sgApiKey;

      const createConnectionInvitation = await this._createConnectionInvitation(connectionPayload, url, apiKey);
      const invitationObject = createConnectionInvitation?.message?.invitation['@id'];

      let shortenedUrl;
      if (agentDetails?.tenantId) {
        shortenedUrl = `${agentEndPoint}/multi-tenancy/url/${agentDetails?.tenantId}/${invitationObject}`;
      } else {
        shortenedUrl = `${agentEndPoint}/url/${invitationObject}`;
      }

      const saveConnectionDetails = await this.connectionRepository.saveAgentConnectionInvitations(shortenedUrl, agentId, orgId);
      return saveConnectionDetails;
    } catch (error) {
      this.logger.error(`[createLegacyConnectionInvitation] - error in connection invitation: ${error}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }


  /**
   * Description: create connection legacy invitation 
   * @param orgId 
   * @param user 
   * @returns Connection legacy invitation URL
   */
  async getConnectionWebhook(
    createDateTime: string, lastChangedDateTime: string, connectionId: string, state: string, orgDid: string, theirLabel: string, autoAcceptConnection: boolean, outOfBandId: string, orgId: number
  ): Promise<object> {
    try {
      const saveConnectionDetails = await this.connectionRepository.saveConnectionWebhook(createDateTime, lastChangedDateTime, connectionId, state, orgDid, theirLabel, autoAcceptConnection, outOfBandId, orgId);
      return saveConnectionDetails;
    } catch (error) {
      this.logger.error(`[getConnectionWebhook] - error in fetch connection webhook: ${error}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }


  /**
   * Description: Store shortening URL 
   * @param referenceId 
   * @param url 
   * @returns connection invitation URL
   */
  async _createConnectionInvitation(connectionPayload: object, url: string, apiKey: string): Promise<ConnectionInvitationResponse> {
    const pattern = { cmd: 'agent-create-connection-legacy-invitation' };
    const payload = { connectionPayload, url, apiKey };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = await this.connectionServiceProxy.send<any>(pattern, payload).toPromise();
      return { message };
    } catch (error) {
      this.logger.error(`catch: ${JSON.stringify(error)}`);
      throw new HttpException({
        status: error.status,
        error: error.message
      }, error.status);
    }
  }


  async storeShorteningUrl(referenceId: string, connectionInvitationUrl: string): Promise<object> {
    try {
      return this.connectionRepository.storeShorteningUrl(referenceId, connectionInvitationUrl);

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
  async getUrl(
    referenceId: string): Promise<string> {
    try {
      const urlDetails = await this.connectionRepository.getShorteningUrl(referenceId);
      return urlDetails.url;
    } catch (error) {
      this.logger.error(`Error in get url in connection service: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
 * Description: Fetch all connections
 * @param outOfBandId
 * @param alias
 * @param state
 * @param myDid
 * @param theirDid
 * @param theirLabel
 * @param orgId
 * @param user
 *  
 * @returns get all connections details
 */
  async getConnections(user: IUserRequest, outOfBandId: string, alias: string, state: string, myDid: string, theirDid: string, theirLabel: string, orgId: number): Promise<string> {
    try {
      const agentDetails = await this.connectionRepository.getAgentEndPoint(orgId);
      const platformConfig: platform_config = await this.connectionRepository.getPlatformConfigDetails();

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

      let url;
      if (agentDetails?.orgAgentTypeId === OrgAgentType.DEDICATED) {

        url = `${agentEndPoint}${CommonConstants.URL_CONN_GET_CONNECTIONS}`;

      } else if (agentDetails?.orgAgentTypeId === OrgAgentType.SHARED) {

        url = `${agentEndPoint}${CommonConstants.URL_SHAGENT_GET_CREATEED_INVITATIONS}`.replace('#', agentDetails.tenantId);
      } else {

        throw new NotFoundException(ResponseMessages.connection.error.agentUrlNotFound);
      }

      Object.keys(params).forEach((element: string) => {
        const appendParams: string = url.includes('?') ? '&' : '?';

        if (params[element] !== undefined) {
          url = `${url + appendParams + element}=${params[element]}`;
        }
      });
      const apiKey = platformConfig?.sgApiKey;
      const connectionsDetails = await this._getAllConnections(url, apiKey);
      return connectionsDetails?.response;
    } catch (error) {
      this.logger.error(`Error in get url in connection service: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }


  async _getAllConnections(url: string, apiKey: string): Promise<{
    response: string;
  }> {
    try {
      const pattern = { cmd: 'agent-get-all-connections' };
      const payload = { url, apiKey };
      return this.connectionServiceProxy
        .send<string>(pattern, payload)
        .pipe(
          map((response) => (
            {
              response
            }))
        ).toPromise()
        .catch(error => {
          this.logger.error(`catch: ${JSON.stringify(error)}`);
          throw new HttpException(
            {
              status: error.statusCode,
              error: error.message
            }, error.error);
        });
    } catch (error) {
      this.logger.error(`[_getAllConnections] [NATS call]- error in fetch connections details : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getConnectionsById(user: IUserRequest, connectionId: string, orgId: number): Promise<string> {
    try {

      const agentDetails = await this.connectionRepository.getAgentEndPoint(orgId);
      const platformConfig: platform_config = await this.connectionRepository.getPlatformConfigDetails();

      const { agentEndPoint } = agentDetails;
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }

      let url;
      if (agentDetails?.orgAgentTypeId === OrgAgentType.DEDICATED) {

        url = `${agentEndPoint}${CommonConstants.URL_CONN_GET_CONNECTION_BY_ID}`.replace('#', connectionId);
      } else if (agentDetails?.orgAgentTypeId === OrgAgentType.SHARED) {

        url = `${agentEndPoint}${CommonConstants.URL_SHAGENT_GET_CREATEED_INVITATION_BY_CONNECTIONID}`.replace('#', connectionId).replace('@', agentDetails.tenantId);
      } else {

        throw new NotFoundException(ResponseMessages.connection.error.agentUrlNotFound);
      }

      const apiKey = platformConfig?.sgApiKey;
      const createConnectionInvitation = await this._getConnectionsByConnectionId(url, apiKey);
      return createConnectionInvitation?.response;
    } catch (error) {
      this.logger.error(`[getConnectionsById] - error in get connections : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async _getConnectionsByConnectionId(url: string, apiKey: string): Promise<{
    response: string;
  }> {
    try {
      const pattern = { cmd: 'agent-get-connections-by-connectionId' };
      const payload = { url, apiKey };
      return this.connectionServiceProxy
        .send<string>(pattern, payload)
        .pipe(
          map((response) => (
            {
              response
            }))
        ).toPromise()
        .catch(error => {
          this.logger.error(`catch: ${JSON.stringify(error)}`);
          throw new HttpException(
            {
              status: error.statusCode,
              error: error.message
            }, error.error);
        });
    } catch (error) {
      this.logger.error(`[_getConnectionsByConnectionId] [NATS call]- error in fetch connections : ${JSON.stringify(error)}`);
      throw error;
    }
  }
  /**
  * Description: Fetch agent url 
  * @param referenceId 
  * @returns agent URL
  */
  async getAgentUrl(
    orgAgentTypeId: number,
    agentEndPoint: string,
    tenantId?: string
  ): Promise<string> {
    try {

      let url;
      if (orgAgentTypeId === OrgAgentType.DEDICATED) {

        url = `${agentEndPoint}${CommonConstants.URL_CONN_LEGACY_INVITE}`;
      } else if (orgAgentTypeId === OrgAgentType.SHARED) {

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
}
