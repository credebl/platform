/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable yoda */
/* eslint-disable no-useless-catch */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
import {
  BadRequestException,
  ConflictException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { map } from 'rxjs/operators';
dotenv.config();
import { IGetCredDefAgentRedirection, IConnectionDetails, IUserRequestInterface, IAgentSpinupDto, IStoreOrgAgentDetails, ITenantCredDef, ITenantDto, ITenantSchema, IWalletProvision, ISendProofRequestPayload, IIssuanceCreateOffer, IOutOfBandCredentialOffer, IAgentSpinUpSatus, ICreateTenant, IAgentStatus, ICreateOrgAgent, IOrgAgentsResponse, IProofPresentation, IAgentProofRequest, IPresentation, IReceiveInvitationUrl, IReceiveInvitation } from './interface/agent-service.interface';
import { AgentSpinUpStatus, AgentType, Ledgers, OrgAgentType } from '@credebl/enum/enum';
import { AgentServiceRepository } from './repositories/agent-service.repository';
import { ledgers, org_agents, organisation, platform_config } from '@prisma/client';
import { CommonConstants } from '@credebl/common/common.constant';
import { CommonService } from '@credebl/common';
import { GetSchemaAgentRedirection } from 'apps/ledger/src/schema/schema.interface';
import { ConnectionService } from 'apps/connection/src/connection.service';
import { ResponseMessages } from '@credebl/common/response-messages';
import { Socket, io } from 'socket.io-client';
import { WebSocketGateway } from '@nestjs/websockets';
import * as retry from 'async-retry';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { IProofPresentationDetails } from '@credebl/common/interfaces/verification.interface';
import { ICreateConnectionUrl } from '@credebl/common/interfaces/connection.interface';
import { IConnectionDetailsById } from 'apps/api-gateway/src/interfaces/IConnectionSearch.interface';

@Injectable()
@WebSocketGateway()
export class AgentServiceService {

  private readonly logger = new Logger('WalletService');

  constructor(
    private readonly agentServiceRepository: AgentServiceRepository,
    private readonly commonService: CommonService,
    private readonly connectionService: ConnectionService,
    @Inject('NATS_CLIENT') private readonly agentServiceProxy: ClientProxy,
    @Inject(CACHE_MANAGER) private cacheService: Cache
  ) { }

  async ReplaceAt(input, search, replace, start, end): Promise<string> {
    return input.slice(0, start)
      + input.slice(start, end).replace(search, replace)
      + input.slice(end);
  }

  async _validateInternalIp(
    platformConfig: platform_config,
    controllerIp: string
  ): Promise<string> {
    let internalIp = '';
    const maxIpLength = '255';
    const indexValue = 1;
    const controllerIpLength = 0;
    try {
      if (
        platformConfig.lastInternalId.split('.')[3] < maxIpLength &&
        platformConfig.lastInternalId.split('.')[3] !== maxIpLength
      ) {
        internalIp = await this.ReplaceAt(
          controllerIp,
          controllerIp.split('.')[3],
          parseInt(controllerIp.split('.')[3]) + indexValue,
          controllerIp.lastIndexOf('.') + indexValue,
          controllerIp.length
        );

        platformConfig.lastInternalId = internalIp;
      } else if (
        platformConfig.lastInternalId.split('.')[2] < maxIpLength &&
        platformConfig.lastInternalId.split('.')[2] !== maxIpLength
      ) {
        internalIp = await this.ReplaceAt(
          controllerIp,
          controllerIp.split('.')[2],
          parseInt(controllerIp.split('.')[2]) + indexValue,
          controllerIp.indexOf('.', controllerIp.indexOf('.') + indexValue) +
          indexValue,
          controllerIp.length
        );

        platformConfig.lastInternalId = internalIp;
      } else if (
        platformConfig.lastInternalId.split('.')[1] < maxIpLength &&
        platformConfig.lastInternalId.split('.')[1] !== maxIpLength
      ) {
        internalIp = await this.ReplaceAt(
          controllerIp,
          controllerIp.split('.')[1],
          parseInt(controllerIp.split('.')[1]) + indexValue,
          controllerIp.indexOf('.', controllerIp.indexOf('.')) + indexValue,
          controllerIp.length
        );

        platformConfig.lastInternalId = internalIp;
      } else if (
        platformConfig.lastInternalId.split('.')[0] < maxIpLength &&
        platformConfig.lastInternalId.split('.')[0] !== maxIpLength
      ) {
        internalIp = await this.ReplaceAt(
          controllerIp,
          controllerIp.split('.')[0],
          parseInt(controllerIp.split('.')[0]) + indexValue,
          controllerIpLength,
          controllerIp.length
        );

        platformConfig.lastInternalId = internalIp;
      } else {
        this.logger.error(`This IP address is not valid!`);
        throw new BadRequestException(`This IP address is not valid!`);
      }

      return internalIp;
    } catch (error) {
      this.logger.error(`error in valid internal ip : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   * Spinup the agent by organization
   * @param agentSpinupDto 
   * @param user 
   * @returns Get agent status
   */
  async walletProvision(agentSpinupDto: IAgentSpinupDto, user: IUserRequestInterface): Promise<IAgentSpinUpSatus> {
    let agentProcess: ICreateOrgAgent;
    try {

      // Invoke an internal function to create wallet
      await this.processWalletProvision(agentSpinupDto, user);
      const agentStatusResponse = {
        agentSpinupStatus: AgentSpinUpStatus.PROCESSED
      };

      return agentStatusResponse;
    } catch (error) {

      // Invoke an internal function to handle error to create wallet
      this.handleErrorOnWalletProvision(agentSpinupDto, error, agentProcess);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  private async processWalletProvision(agentSpinupDto: IAgentSpinupDto, user: IUserRequestInterface): Promise<void> {
    let platformAdminUser;
    let userId: string;
    let agentProcess: ICreateOrgAgent;
    let getOrgAgent;
    try {

      const [platformConfig, getAgentType, ledgerIdData] = await Promise.all([
        this.agentServiceRepository.getPlatformConfigDetails(),
        this.agentServiceRepository.getAgentTypeDetails(),
        this.agentServiceRepository.getLedgerDetails(agentSpinupDto.ledgerName ? agentSpinupDto.ledgerName : [Ledgers.Indicio_Demonet])
      ]);

      let orgData;
      if (!user?.userId && agentSpinupDto?.platformAdminEmail) {


        // Get Platform admin user by platform admin email
        platformAdminUser = await this.agentServiceRepository.getPlatfomAdminUser(agentSpinupDto?.platformAdminEmail);

        userId = platformAdminUser?.id;
      } else {
        userId = user?.id;
      }

      // Get platform org
      const platformAdminOrgDetails = await this.agentServiceRepository.getPlatfomOrg(agentSpinupDto?.orgName);

      if (agentSpinupDto.orgId) {

        // Get organization details
        getOrgAgent = await this.agentServiceRepository.getAgentDetails(agentSpinupDto.orgId);

        // Get organization data by orgId
        orgData = await this.agentServiceRepository.getOrgDetails(agentSpinupDto.orgId);
      } else {

        // Get platform organization details
        getOrgAgent = await this.agentServiceRepository.getAgentDetails(platformAdminOrgDetails);

        // Get platform organization data by orgId
        orgData = await this.agentServiceRepository.getOrgDetails(platformAdminOrgDetails);
      }

      agentSpinupDto.ledgerId = agentSpinupDto.ledgerId?.length ? agentSpinupDto.ledgerId : ledgerIdData.map(ledger => ledger?.id);

      // Get genesis URL and ledger details
      const ledgerDetails = await this.agentServiceRepository.getGenesisUrl(agentSpinupDto.ledgerId);

      if (AgentSpinUpStatus.PROCESSED === getOrgAgent?.agentSpinUpStatus) {
        throw new BadRequestException(
          ResponseMessages.agent.error.walletAlreadyProcessing,
          { cause: new Error(), description: ResponseMessages.errorMessages.badRequest }
        );
      }

      if (AgentSpinUpStatus.COMPLETED === getOrgAgent?.agentSpinUpStatus) {
        throw new BadRequestException(
          ResponseMessages.agent.error.walletAlreadyCreated,
          { cause: new Error(), description: ResponseMessages.errorMessages.badRequest }
        );
      }

      if (!agentSpinupDto.orgId) {

        if (platformAdminOrgDetails) {
          agentSpinupDto.orgId = platformAdminOrgDetails;
        }
      }

      agentSpinupDto.agentType = agentSpinupDto.agentType || getAgentType;
      agentSpinupDto.tenant = agentSpinupDto.tenant || false;
      agentSpinupDto.ledgerName = agentSpinupDto.ledgerName?.length ? agentSpinupDto.ledgerName : [Ledgers.Indicio_Demonet];


      // Invoke function for validate platform configuration
      this.validatePlatformConfig(platformConfig);

      const externalIp = platformConfig?.externalIp;
      const controllerIp = platformConfig?.lastInternalId !== 'false' ? platformConfig?.lastInternalId : '';
      const apiEndpoint = platformConfig?.apiEndpoint;

      // Create payload for the wallet create and store payload
      const walletProvisionPayload = await this.prepareWalletProvisionPayload(agentSpinupDto, externalIp, apiEndpoint, controllerIp, ledgerDetails, platformConfig, orgData);


      // Socket connection
      const socket: Socket = await this.initSocketConnection(`${process.env.SOCKET_HOST}`);
      this.emitAgentSpinupInitiatedEvent(agentSpinupDto, socket);

      const agentSpinUpStatus = AgentSpinUpStatus.PROCESSED;
      agentProcess = await this.createOrgAgent(agentSpinUpStatus, userId);

      // AFJ agent spin-up
      this._agentSpinup(walletProvisionPayload, agentSpinupDto, platformConfig?.sgApiKey, orgData, user, socket, agentSpinupDto.ledgerId, agentProcess);

    } catch (error) {
      this.handleErrorOnWalletProvision(agentSpinupDto, error, agentProcess);
      throw error;
    }
  }

  validatePlatformConfig(platformConfig: platform_config): void {
    if (!platformConfig) {
      this.logger.error(`Platform configuration is missing or invalid`);
      throw new BadRequestException(
        ResponseMessages.agent.error.platformConfiguration,
        { cause: new Error(), description: ResponseMessages.errorMessages.badRequest }
      );
    }

    if (!platformConfig.apiEndpoint) {
      this.logger.error(`API endpoint is missing in the platform configuration`);
      throw new BadRequestException(
        ResponseMessages.agent.error.apiEndpoint,
        { cause: new Error(), description: ResponseMessages.errorMessages.badRequest }
      );
    }

    if (!platformConfig.externalIp) {
      this.logger.error(`External IP is missing in the platform configuration`);
      throw new BadRequestException(
        ResponseMessages.agent.error.externalIp,
        { cause: new Error(), description: ResponseMessages.errorMessages.badRequest }
      );
    }

    if (typeof platformConfig.externalIp !== 'string') {
      this.logger.error(`External IP must be a string`);
      throw new BadRequestException(
        ResponseMessages.agent.error.externalIp,
        { cause: new Error(), description: ResponseMessages.errorMessages.badRequest }
      );
    }
  }

  validateAgentProcess(agentProcess: ICreateOrgAgent): void {
    try {
      if (!agentProcess) {
        this.logger.error(`Agent process is invalid or not in a completed state`);
        throw new BadRequestException(
          ResponseMessages.agent.error.externalIp,
          { cause: new Error(), description: ResponseMessages.errorMessages.badRequest }
        );
      }
    } catch (error) {
      this.logger.error(`Error validating agent process: ${error.message}`);
      throw error;
    }
  }

  emitAgentSpinupInitiatedEvent(agentSpinupDto: IAgentSpinupDto, socket: Socket): void {
    try {
      if (agentSpinupDto.clientSocketId) {

        socket.emit('agent-spinup-process-initiated', { clientId: agentSpinupDto.clientSocketId });
        // Log or perform other actions after emitting the event
        this.logger.log(`Agent spinup initiated event emitted for orgId ${agentSpinupDto.orgId}`);
      }

    } catch (error) {
      this.logger.error(`Error emitting agent-spinup-initiated event: ${error.message}`);
      throw error;
    }
  }

  async prepareWalletProvisionPayload(
    agentSpinupDto: IAgentSpinupDto,
    externalIp: string,
    apiEndpoint: string,
    controllerIp: string,
    ledgerDetails: ledgers[],
    platformConfig: platform_config,
    orgData: organisation
  ): Promise<IWalletProvision> {
    const ledgerArray = ledgerDetails.map(ledger => ({
      genesisTransactions: ledger.poolConfig,
      indyNamespace: ledger.indyNamespace
    }));

    const escapedJsonString = JSON.stringify(ledgerArray).replace(/"/g, '\\"');

    const walletProvisionPayload: IWalletProvision = {
      orgId: orgData?.id,
      externalIp,
      walletName: agentSpinupDto?.walletName,
      walletPassword: agentSpinupDto?.walletPassword,
      seed: agentSpinupDto?.seed,
      webhookEndpoint: apiEndpoint,
      walletStorageHost: process.env.WALLET_STORAGE_HOST || '',
      walletStoragePort: process.env.WALLET_STORAGE_PORT || '',
      walletStorageUser: process.env.WALLET_STORAGE_USER || '',
      walletStoragePassword: process.env.WALLET_STORAGE_PASSWORD || '',
      internalIp: await this._validateInternalIp(platformConfig, controllerIp),
      containerName: orgData.name.split(' ').join('_'),
      agentType: AgentType.AFJ,
      orgName: orgData?.name,
      indyLedger: escapedJsonString,
      afjVersion: process.env.AFJ_VERSION || '',
      protocol: process.env.AGENT_PROTOCOL || '',
      tenant: agentSpinupDto.tenant || false,
      apiKey: agentSpinupDto.apiKey
    };

    return walletProvisionPayload;
  }

  async initSocketConnection(socketHost: string): Promise<Socket> {
    const socket = io(socketHost, {
      reconnection: true,
      reconnectionDelay: 5000,
      reconnectionAttempts: Infinity,
      autoConnect: true,
      transports: ['websocket']
    });

    return socket;
  }

  async createOrgAgent(agentSpinUpStatus: AgentSpinUpStatus, userId: string): Promise<ICreateOrgAgent> {
    try {
      const agentProcess = await this.agentServiceRepository.createOrgAgent(agentSpinUpStatus, userId);
      this.logger.log(`Organization agent created with status: ${agentSpinUpStatus}`);
      return agentProcess;
    } catch (error) {

      this.logger.error(`Error creating organization agent: ${error.message}`);
      throw error;
    }
  }

  private async handleErrorOnWalletProvision(agentSpinupDto: IAgentSpinupDto, error: Error, agentProcess: ICreateOrgAgent): Promise<void> {
    if (agentProcess) {
      const socket = await this.initSocketConnection(`${process.env.SOCKET_HOST}`);

      if (agentSpinupDto.clientSocketId) {
        this.emitErrorInWalletCreationEvent(agentSpinupDto, socket, error);
      }
      this.agentServiceRepository.removeOrgAgent(agentProcess?.id);
      this.logger.error(`Error in Agent spin up: ${JSON.stringify(error)}`);
    }
  }

  async emitErrorInWalletCreationEvent(agentSpinupDto: IAgentSpinupDto, socket: Socket, error: Error): Promise<void> {
    try {
      socket.emit('error-in-wallet-creation-process', { clientId: agentSpinupDto.clientSocketId, error });
      this.logger.error(`Error in wallet creation process emitted for orgId ${agentSpinupDto.orgId}: ${error.message}`);

    } catch (emitError) {
      this.logger.error(`Error emitting error-in-wallet-creation-process event: ${emitError.message}`);
      throw emitError;
    }
  }

  async _agentSpinup(walletProvisionPayload: IWalletProvision, agentSpinupDto: IAgentSpinupDto, orgApiKey: string, orgData: organisation, user: IUserRequestInterface, socket: Socket, ledgerId: string[], agentProcess: ICreateOrgAgent): Promise<void> {
    try {

      /**
       * Invoke wallet create and provision with agent 
       */
      const walletProvision = await this._walletProvision(walletProvisionPayload);

      if (!walletProvision?.response) {
        this.logger.error(`Agent not able to spin-up`);
        throw new BadRequestException(
          ResponseMessages.agent.error.notAbleToSpinup,
          { cause: new Error(), description: ResponseMessages.errorMessages.badRequest }
        );
      }
      const agentDetails = walletProvision.response;
      const agentEndPoint = `${process.env.API_GATEWAY_PROTOCOL}://${agentDetails.agentEndPoint}`;

      /**
       * Socket connection
       */
      const socket = await this.initSocketConnection(`${process.env.SOCKET_HOST}`);

      if (agentEndPoint && agentSpinupDto.clientSocketId) {
        socket.emit('agent-spinup-process-completed', { clientId: agentSpinupDto.clientSocketId });
        socket.emit('did-publish-process-initiated', { clientId: agentSpinupDto.clientSocketId });
        socket.emit('invitation-url-creation-started', { clientId: agentSpinupDto.clientSocketId });
      }

      const agentPayload: IStoreOrgAgentDetails = {
        agentEndPoint,
        seed: agentSpinupDto.seed,
        apiKey: agentDetails.agentToken,
        agentsTypeId: agentSpinupDto?.agentType,
        orgId: orgData.id,
        walletName: agentSpinupDto.walletName,
        clientSocketId: agentSpinupDto.clientSocketId,
        ledgerId,
        did: agentSpinupDto.did,
        id: agentProcess?.id
      };

      /**
       * Store organization agent details 
       */
      const storeAgentDetails = await this._storeOrgAgentDetails(agentPayload);

      if (storeAgentDetails) {

        const filePath = `${process.cwd()}${process.env.AFJ_AGENT_TOKEN_PATH}${orgData.id}_${orgData.name.split(' ').join('_')}.json`;
        if (agentDetails?.agentToken) {
          fs.unlink(filePath, (err) => {
            if (err) {
              this.logger.error(`Error removing file: ${err.message}`);
              throw new InternalServerErrorException(err.message);
            } else {
              this.logger.log(`File ${filePath} has been removed successfully`);
            }
          });
        }

        if (agentSpinupDto.clientSocketId) {
          socket.emit('did-publish-process-completed', { clientId: agentSpinupDto.clientSocketId });
        }

        const getOrganization = await this.agentServiceRepository.getOrgDetails(orgData?.id);

        await this._createLegacyConnectionInvitation(orgData?.id, user, getOrganization.name);

        if (agentSpinupDto.clientSocketId) {
          socket.emit('invitation-url-creation-success', { clientId: agentSpinupDto.clientSocketId });
        }
      } else {
        this.logger.error(`Agent not able to spin-up`);
        throw new BadRequestException(
          ResponseMessages.agent.error.notAbleToSpinup,
          { cause: new Error(), description: ResponseMessages.errorMessages.badRequest }
        );
      }
    } catch (error) {
      if (agentSpinupDto.clientSocketId) {
        socket.emit('error-in-wallet-creation-process', { clientId: agentSpinupDto.clientSocketId, error });
      }

      if (agentProcess && agentProcess?.id) {
        /**
         * If getting error remove organization agent 
         */
        await this.agentServiceRepository.removeOrgAgent(agentProcess?.id);
      }
      this.logger.error(`[_agentSpinup] - Error in Agent spin up : ${JSON.stringify(error)}`);
    }
  }

  async _storeOrgAgentDetails(payload: IStoreOrgAgentDetails): Promise<object> {
    try {

      /**
       * Get orgaization agent type and agent details
       */
      const [agentDid, orgAgentTypeId] = await Promise.all([
        this._getAgentDid(payload),
        this.agentServiceRepository.getOrgAgentTypeDetails(OrgAgentType.DEDICATED)
      ]);

      /**
       * Get DID method by agent
       */
      const getDidMethod = await this._getDidMethod(payload, agentDid);

      /**
       * Organization storage data
       */
      const storeOrgAgentData = await this._buildStoreOrgAgentData(payload, getDidMethod, orgAgentTypeId);

      /**
       * Store org agent details
       */
      const storeAgentDid = await this.agentServiceRepository.storeOrgAgentDetails(storeOrgAgentData);

      return storeAgentDid;
    } catch (error) {
      await this._handleError(payload, error);
      throw error;
    }
  }


  private async _getAgentDid(payload: IStoreOrgAgentDetails): Promise<object> {
    const { agentEndPoint, apiKey, seed, ledgerId, did } = payload;
    const writeDid = 'write-did';
    const ledgerDetails = await this.agentServiceRepository.getGenesisUrl(ledgerId);
    const agentDidWriteUrl = `${agentEndPoint}${CommonConstants.URL_AGENT_WRITE_DID}`;
    return this._retryAgentSpinup(agentDidWriteUrl, apiKey, writeDid, seed, ledgerDetails[0].indyNamespace, did);
  }

  private async _getDidMethod(payload: IStoreOrgAgentDetails, agentDid: object): Promise<object> {
    const getDidDic = 'get-did-doc';
    const getDidMethodUrl = `${payload.agentEndPoint}${CommonConstants.URL_AGENT_GET_DID}`.replace('#', agentDid['did']);
    return this._retryAgentSpinup(getDidMethodUrl, payload.apiKey, getDidDic);
  }

  private _buildStoreOrgAgentData(payload: IStoreOrgAgentDetails, getDidMethod: object, orgAgentTypeId: string): IStoreOrgAgentDetails {
    return {
      did: getDidMethod['didDocument']?.id,
      verkey: getDidMethod['didDocument']?.verificationMethod[0]?.publicKeyBase58,
      isDidPublic: true,
      agentSpinUpStatus: AgentSpinUpStatus.COMPLETED,
      walletName: payload.walletName,
      agentsTypeId: payload.agentsTypeId,
      orgId: payload.orgId,
      agentEndPoint: payload.agentEndPoint,
      agentId: payload.agentId,
      orgAgentTypeId,
      ledgerId: payload.ledgerId,
      id: payload.id,
      apiKey: payload.apiKey
    };
  }

  private async _handleError(payload: IStoreOrgAgentDetails, error: Error): Promise<void> {
    if (payload.clientSocketId) {
      const socket = await io(`${process.env.SOCKET_HOST}`, {
        reconnection: true,
        reconnectionDelay: 5000,
        reconnectionAttempts: Infinity,
        autoConnect: true,
        transports: ['websocket']
      });
      socket.emit('error-in-wallet-creation-process', { clientId: payload.clientSocketId, error });
    }

    if (payload && payload?.id) {
      this.agentServiceRepository.removeOrgAgent(payload?.id);
    }

    this.logger.error(`[_storeOrgAgentDetails] - Error in store agent details : ${JSON.stringify(error)}`);
  }

  async _retryAgentSpinup(agentUrl: string, apiKey: string, agentApiState: string, seed?: string, indyNamespace?: string, did?: string): Promise<object> {
    const retryOptions = {
      retries: 10
    };

    try {
      return retry(async () => {
        if (agentApiState === 'write-did') {
          return this.commonService.httpPost(agentUrl, { seed, method: indyNamespace, did }, { headers: { 'authorization': apiKey } });
        } else if (agentApiState === 'get-did-doc') {
          return this.commonService.httpGet(agentUrl, { headers: { 'authorization': apiKey } });
        }
      }, retryOptions);
    } catch (error) {
      throw error;
    }
  }

  
  async _createLegacyConnectionInvitation(orgId: string, user: IUserRequestInterface, label: string): Promise<{
    response;
  }> {
    try {
      const pattern = {
        cmd: 'create-connection'
      };
      const payload = { orgId, user, label };
      return this.agentServiceProxy
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
      this.logger.error(`error in create-connection in wallet provision : ${JSON.stringify(error)}`);
    }
  }


  async _walletProvision(payload: IWalletProvision): Promise<{
    response;
  }> {
    try {
      const pattern = {
        cmd: 'wallet-provisioning'
      };
      return this.agentServiceProxy
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
      this.logger.error(`error in wallet provision : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  /**
   * Create tenant (Shared agent)
   * @param payload 
   * @param user 
   * @returns Get agent status
   */
  async createTenant(payload: ITenantDto, user: IUserRequestInterface): Promise<IAgentSpinUpSatus> {
    try {

      const agentStatusResponse = {
        agentSpinupStatus: AgentSpinUpStatus.PROCESSED
      };

      const getOrgAgent = await this.agentServiceRepository.getAgentDetails(payload.orgId);

      if (AgentSpinUpStatus.COMPLETED === getOrgAgent?.agentSpinUpStatus) {
        this.logger.error(`Your wallet is already been created.`);
        throw new ConflictException(
          ResponseMessages.agent.error.walletAlreadyCreated,
          { cause: new Error(), description: ResponseMessages.errorMessages.conflict }
        );
      }

      if (AgentSpinUpStatus.PROCESSED === getOrgAgent?.agentSpinUpStatus) {
        this.logger.error(`Your wallet is already processing.`);
        throw new ConflictException(
          ResponseMessages.agent.error.walletAlreadyProcessing,
          { cause: new Error(), description: ResponseMessages.errorMessages.conflict }
        );
      }

      // Create tenant
      this._createTenant(payload, user);
      return agentStatusResponse;
    } catch (error) {
      this.logger.error(`error in create tenant : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   * Create tenant (Shared agent)
   * @param payload 
   * @param user 
   * @returns Get agent status
   */
  async _createTenant(payload: ITenantDto, user: IUserRequestInterface): Promise<void> {
    let agentProcess;

    try {

      // Get orgaization agent details by orgId
      const getOrgAgent = await this.agentServiceRepository.getAgentDetails(payload.orgId);

      if (AgentSpinUpStatus.COMPLETED === getOrgAgent?.agentSpinUpStatus) {
        this.logger.error(`Your wallet has already been created.`);
        throw new BadRequestException(
          ResponseMessages.agent.error.walletAlreadyCreated,
          { cause: new Error(), description: ResponseMessages.errorMessages.badRequest }
        );
      }

      if (AgentSpinUpStatus.PROCESSED === getOrgAgent?.agentSpinUpStatus) {
        this.logger.error(`Your wallet has already processing.`);
        throw new BadRequestException(
          ResponseMessages.agent.error.walletAlreadyProcessing,
          { cause: new Error(), description: ResponseMessages.errorMessages.badRequest }
        );
      }

      // Get ledgers details
      const ledgerIdData = await this.agentServiceRepository.getLedgerDetails(Ledgers.Indicio_Demonet);
      const ledgerIds = ledgerIdData.map(ledger => ledger?.id);

      payload.ledgerId = !payload.ledgerId || 0 === payload.ledgerId?.length ? ledgerIds : payload.ledgerId;
      const agentSpinUpStatus = AgentSpinUpStatus.PROCESSED;

      // Create and stored agent details  
      agentProcess = await this.agentServiceRepository.createOrgAgent(agentSpinUpStatus, user?.id);

      // Get platform admin details
      const platformAdminSpinnedUp = await this.getPlatformAdminAndNotify(payload.clientSocketId);

      // Get genesis URLs by ledger Id
      const ledgerDetails: ledgers[] = await this.agentServiceRepository.getGenesisUrl(payload.ledgerId);

      for (const iterator of ledgerDetails) {

        // Create tenant in agent controller
        const tenantDetails = await this.createTenantAndNotify(payload, iterator, platformAdminSpinnedUp);

        if (AgentSpinUpStatus.COMPLETED !== platformAdminSpinnedUp.org_agents[0].agentSpinUpStatus) {
          this.logger.error(`Platform-admin agent is not spun-up`);
          throw new NotFoundException(
            ResponseMessages.agent.error.platformAdminNotAbleToSpinp,
            { cause: new Error(), description: ResponseMessages.errorMessages.notFound }
          );
        }

        // Get org agent type details by shared agent
        const orgAgentTypeId = await this.agentServiceRepository.getOrgAgentTypeDetails(OrgAgentType.SHARED);

        // Get agent type details by AFJ agent
        const agentTypeId = await this.agentServiceRepository.getAgentTypeId(AgentType.AFJ);

        const storeOrgAgentData: IStoreOrgAgentDetails = {
          did: tenantDetails['did'],
          verkey: tenantDetails['verkey'],
          isDidPublic: true,
          agentSpinUpStatus: AgentSpinUpStatus.COMPLETED,
          agentsTypeId: agentTypeId,
          orgId: payload.orgId,
          agentEndPoint: platformAdminSpinnedUp.org_agents[0].agentEndPoint,
          orgAgentTypeId,
          tenantId: tenantDetails['tenantRecord']['id'],
          walletName: payload.label,
          ledgerId: payload.ledgerId,
          id: agentProcess?.id
        };

        // Get organization data
        const getOrganization = await this.agentServiceRepository.getOrgDetails(payload.orgId);

        this.notifyClientSocket('agent-spinup-process-completed', payload.clientSocketId);
        await this.agentServiceRepository.storeOrgAgentDetails(storeOrgAgentData);

        this.notifyClientSocket('invitation-url-creation-started', payload.clientSocketId);

        // Create the legacy connection invitation
        this._createLegacyConnectionInvitation(payload.orgId, user, getOrganization.name);

        this.notifyClientSocket('invitation-url-creation-success', payload.clientSocketId);
      }
    } catch (error) {
      this.handleError(error, payload.clientSocketId);

      if (agentProcess && agentProcess?.id) {
        this.agentServiceRepository.removeOrgAgent(agentProcess?.id);
      }
      throw error;
    }
  }

  private async getPlatformAdminAndNotify(clientSocketId: string | undefined): Promise<IOrgAgentsResponse> {
    const socket = await this.createSocketInstance();
    if (clientSocketId) {
      socket.emit('agent-spinup-process-initiated', { clientId: clientSocketId });
    }

    const platformAdminSpinnedUp = await this.agentServiceRepository.platformAdminAgent(CommonConstants.PLATFORM_ADMIN_ORG);

    if (!platformAdminSpinnedUp) {
      this.logger.error(`Agent not able to spin-up`);
      throw new BadRequestException(
        ResponseMessages.agent.error.notAbleToSpinp,
        { cause: new Error(), description: ResponseMessages.errorMessages.serverError }
      );
    }

    return platformAdminSpinnedUp;
  }

  /**
   * Create tenant on the agent
   * @param payload 
   * @param ledgerIds 
   * @param platformAdminSpinnedUp 
   * @returns Get tanant status
   */
  private async createTenantAndNotify(payload: ITenantDto, ledgerIds: ledgers, platformAdminSpinnedUp: IOrgAgentsResponse): Promise<ICreateTenant> {
    const socket = await this.createSocketInstance();
    if (payload.clientSocketId) {
      socket.emit('agent-spinup-process-initiated', { clientId: payload.clientSocketId });
    }

    const { label, seed, did } = payload;
    const createTenantOptions = {
      config: { label },
      seed,
      did: did ? did : undefined,
      method: ledgerIds.indyNamespace
    };


    // Invoke an API request from the agent to create multi-tenant agent
    const tenantDetails = await this.commonService.httpPost(
      `${platformAdminSpinnedUp.org_agents[0].agentEndPoint}${CommonConstants.URL_SHAGENT_CREATE_TENANT}`,
      createTenantOptions,
      { headers: { 'authorization': platformAdminSpinnedUp.org_agents[0].apiKey } }
    );

    return tenantDetails;
  }

  private async createSocketInstance(): Promise<Socket> {
    return io(`${process.env.SOCKET_HOST}`, {
      reconnection: true,
      reconnectionDelay: 5000,
      reconnectionAttempts: Infinity,
      autoConnect: true,
      transports: ['websocket']
    });
  }

  private async notifyClientSocket(eventName: string, clientId: string | undefined): Promise<void> {
    const socket = await this.createSocketInstance();
    if (clientId) {
      socket.emit(eventName, { clientId });
    }
  }

  private async handleError(error: Error, clientSocketId: string | undefined): Promise<void> {
    this.logger.error(`Error in creating tenant: ${error}`);
    const socket = await this.createSocketInstance();

    if (clientSocketId) {
      socket.emit('error-in-wallet-creation-process', { clientId: clientSocketId, error });
    }
  }

  async createSchema(payload: ITenantSchema): Promise<object> {
    try {
      let schemaResponse;

      if (OrgAgentType.DEDICATED === payload.agentType) {

        const url = `${payload.agentEndPoint}${CommonConstants.URL_SCHM_CREATE_SCHEMA}`;
        const schemaPayload = {
          attributes: payload.attributes,
          version: payload.version,
          name: payload.name,
          issuerId: payload.issuerId
        };
        schemaResponse = await this.commonService.httpPost(url, schemaPayload, { headers: { 'authorization': payload.apiKey } })
          .then(async (schema) => {
            return schema;
          })
          .catch(error => {
            throw new InternalServerErrorException(
              ResponseMessages.agent.error.agentDown,
              { cause: new Error(), description: ResponseMessages.errorMessages.serverError }
            );
          });

      } else if (OrgAgentType.SHARED === payload.agentType) {

        const url = `${payload.agentEndPoint}${CommonConstants.URL_SHAGENT_CREATE_SCHEMA}`.replace('#', `${payload.tenantId}`);
        const schemaPayload = {
          attributes: payload.payload.attributes,
          version: payload.payload.version,
          name: payload.payload.name,
          issuerId: payload.payload.issuerId
        };
        schemaResponse = await this.commonService.httpPost(url, schemaPayload, { headers: { 'authorization': payload.apiKey } })
          .then(async (schema) => {
            return schema;
          })
          .catch(error => {
            throw new InternalServerErrorException(
              ResponseMessages.agent.error.agentDown,
              { cause: new Error(), description: ResponseMessages.errorMessages.serverError }
            );
          });
      }
      return schemaResponse;
    } catch (error) {
      this.logger.error(`Error in creating schema: ${error}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async getSchemaById(payload: GetSchemaAgentRedirection): Promise<object> {
    try {
      let schemaResponse;

      if (OrgAgentType.DEDICATED === payload.agentType) {
        const url = `${payload.agentEndPoint}${CommonConstants.URL_SCHM_GET_SCHEMA_BY_ID.replace('#', `${payload.schemaId}`)}`;
        schemaResponse = await this.commonService.httpGet(url, payload.schemaId)
          .then(async (schema) => {
            return schema;
          });

      } else if (OrgAgentType.SHARED === payload.agentType) {
        const url = `${payload.agentEndPoint}${CommonConstants.URL_SHAGENT_GET_SCHEMA}`.replace('@', `${payload.payload.schemaId}`).replace('#', `${payload.tenantId}`);

        schemaResponse = await this.commonService.httpGet(url, { headers: { 'authorization': payload.apiKey } })
          .then(async (schema) => {
            return schema;
          });
      }
      return schemaResponse;
    } catch (error) {
      this.logger.error(`Error in getting schema: ${error}`);
      throw error;
    }
  }

  async createCredentialDefinition(payload: ITenantCredDef): Promise<object> {
    try {
      let credDefResponse;

      if (OrgAgentType.DEDICATED === String(payload.agentType)) {

        const url = `${payload.agentEndPoint}${CommonConstants.URL_SCHM_CREATE_CRED_DEF}`;
        const credDefPayload = {
          tag: payload.tag,
          schemaId: payload.schemaId,
          issuerId: payload.issuerId
        };

        credDefResponse = await this.commonService.httpPost(url, credDefPayload, { headers: { 'authorization': payload.apiKey } })
          .then(async (credDef) => {
            return credDef;
          });

      } else if (OrgAgentType.SHARED === payload.agentType) {
        const url = `${payload.agentEndPoint}${CommonConstants.URL_SHAGENT_CREATE_CRED_DEF}`.replace('#', `${payload.tenantId}`);
        const credDefPayload = {
          tag: payload.payload.tag,
          schemaId: payload.payload.schemaId,
          issuerId: payload.payload.issuerId
        };
        credDefResponse = await this.commonService.httpPost(url, credDefPayload, { headers: { 'authorization': payload.apiKey } })
          .then(async (credDef) => {
            return credDef;
          });
      }

      return credDefResponse;
    } catch (error) {
      this.logger.error(`Error in creating credential definition: ${error}`);
      throw error;
    }
  }

  async getCredentialDefinitionById(payload: IGetCredDefAgentRedirection): Promise<object> {
    try {
      let credDefResponse;

      if (OrgAgentType.DEDICATED === payload.agentType) {
        const url = `${payload.agentEndPoint}${CommonConstants.URL_SCHM_GET_CRED_DEF_BY_ID.replace('#', `${payload.credentialDefinitionId}`)}`;
        credDefResponse = await this.commonService.httpGet(url, payload.credentialDefinitionId)
          .then(async (credDef) => {
            return credDef;
          });

      } else if (OrgAgentType.SHARED === payload.agentType) {
        const url = `${payload.agentEndPoint}${CommonConstants.URL_SHAGENT_GET_CRED_DEF}`.replace('@', `${payload.payload.credentialDefinitionId}`).replace('#', `${payload.tenantId}`);
        credDefResponse = await this.commonService.httpGet(url, { headers: { 'authorization': payload.apiKey } })
          .then(async (credDef) => {
            return credDef;
          });
      }
      return credDefResponse;
    } catch (error) {
      this.logger.error(`Error in getting schema: ${error}`);
      throw error;
    }
  }

  async createLegacyConnectionInvitation(connectionPayload: IConnectionDetails, url: string, apiKey: string): Promise<ICreateConnectionUrl> {
    try {


      const data = await this.commonService
        .httpPost(url, connectionPayload, { headers: { 'authorization': apiKey } })
        .then(async response => response);

      return data;
    } catch (error) {
      this.logger.error(`Error in connection Invitation in agent service : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async sendCredentialCreateOffer(issueData: IIssuanceCreateOffer, url: string, apiKey: string): Promise<object> {
    try {
      const data = await this.commonService
        .httpPost(url, issueData, { headers: { 'authorization': apiKey } })
        .then(async response => response);
      return data;
    } catch (error) {
      this.logger.error(`Error in sendCredentialCreateOffer in agent service : ${JSON.stringify(error)}`);
      throw error;
    }
  }
  async getProofPresentations(url: string, apiKey: string): Promise<object> {
    try {
      const getProofPresentationsData = await this.commonService
        .httpGet(url, { headers: { 'authorization': apiKey } })
        .then(async response => response);

      return getProofPresentationsData;
    } catch (error) {
      this.logger.error(`Error in proof presentations in agent service : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getIssueCredentials(url: string, apiKey: string): Promise<object> {
    try {
      const data = await this.commonService
        .httpGet(url, { headers: { 'authorization': apiKey } })
        .then(async response => response);
      return data;
    } catch (error) {
      this.logger.error(`Error in getIssueCredentials in agent service : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getProofPresentationById(url: string, apiKey: string): Promise<IProofPresentation> {
    try {
      const getProofPresentationById = await this.commonService
        .httpGet(url, { headers: { 'authorization': apiKey } })
        .then(async response => response)
        .catch(error => this.handleAgentSpinupStatusErrors(error));

      return getProofPresentationById;
    } catch (error) {
      this.logger.error(`Error in proof presentation by id in agent service : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async getIssueCredentialsbyCredentialRecordId(url: string, apiKey: string): Promise<object> {
    try {
      const data = await this.commonService
        .httpGet(url, { headers: { 'authorization': apiKey } })
        .then(async response => response);
      return data;
    } catch (error) {
      this.logger.error(`Error in getIssueCredentialsbyCredentialRecordId in agent service : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async sendProofRequest(proofRequestPayload: ISendProofRequestPayload, url: string, apiKey: string): Promise<IAgentProofRequest> {
    try {
      const sendProofRequest = await this.commonService
        .httpPost(url, proofRequestPayload, { headers: { 'authorization': apiKey } })
        .then(async response => response);
      return sendProofRequest;
    } catch (error) {
      this.logger.error(`Error in send proof request in agent service : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async verifyPresentation(url: string, apiKey: string): Promise<IPresentation> {
    try {
      const verifyPresentation = await this.commonService
        .httpPost(url, '', { headers: { 'authorization': apiKey } })
        .then(async response => response)
        .catch(error => this.handleAgentSpinupStatusErrors(error));
      return verifyPresentation;
    } catch (error) {
      this.logger.error(`Error in verify proof presentation in agent service : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async getConnections(url: string, apiKey: string): Promise<object> {
    try {
      const data = await this.commonService
        .httpGet(url, { headers: { 'authorization': apiKey } })
        .then(async response => response);
      return data;
    } catch (error) {
      this.logger.error(`Error in getConnections in agent service : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getConnectionsByconnectionId(url: string, apiKey: string): Promise<IConnectionDetailsById> {

    try {
      const data = await this.commonService
        .httpGet(url, { headers: { 'authorization': apiKey } })
        .then(async response => response)
        .catch(error => this.handleAgentSpinupStatusErrors(error));

      return data;
    } catch (error) {
      this.logger.error(`Error in getConnectionsByconnectionId in agent service : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }

  }

  /**
   * Get agent health
   * @param orgId 
   * @returns agent status
   */
  async getAgentHealthDetails(orgId: string): Promise<IAgentStatus> {
    try {

      // Get organization agent details
      const orgAgentDetails: org_agents = await this.agentServiceRepository.getOrgAgentDetails(orgId);

      let agentApiKey;
      if (orgAgentDetails) {

        agentApiKey = await this.cacheService.get(CommonConstants.CACHE_APIKEY_KEY);
        if (!agentApiKey || null === agentApiKey || undefined === agentApiKey) {
          agentApiKey = await this.getOrgAgentApiKey(orgId);
        }

        if (agentApiKey === undefined || null) {
          agentApiKey = await this.getOrgAgentApiKey(orgId);
        }
      }

      if (!orgAgentDetails) {
        throw new NotFoundException(
          ResponseMessages.agent.error.agentNotExists,
          { cause: new Error(), description: ResponseMessages.errorMessages.notFound }
        );
      }

      if (!orgAgentDetails?.agentEndPoint) {
        throw new NotFoundException(
          ResponseMessages.agent.error.agentUrl,
          { cause: new Error(), description: ResponseMessages.errorMessages.notFound }
        );
      }

      // Invoke an API request from the agent to assess its current status
      const agentHealthData = await this.commonService
        .httpGet(`${orgAgentDetails.agentEndPoint}${CommonConstants.URL_AGENT_STATUS}`, { headers: { 'authorization': agentApiKey } })
        .then(async response => response);

      return agentHealthData;

    } catch (error) {
      this.logger.error(`Agent health details : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async sendOutOfBandProofRequest(proofRequestPayload: ISendProofRequestPayload, url: string, apiKey: string): Promise<object> {
    try {
      const sendProofRequest = await this.commonService
        .httpPost(url, proofRequestPayload, { headers: { 'authorization': apiKey } })
        .then(async response => response);
      return sendProofRequest;
    } catch (error) {
      this.logger.error(`Error in send out of band proof request in agent service : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getVerifiedProofDetails(url: string, apiKey: string): Promise<IProofPresentationDetails[]> {
    try {
      const getVerifiedProofData = await this.commonService
        .httpGet(url, { headers: { 'authorization': apiKey } })
        .then(async response => response)
        .catch(error => this.handleAgentSpinupStatusErrors(error));

      return getVerifiedProofData;
    } catch (error) {
      this.logger.error(`Error in get verified proof details in agent service : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async schemaEndorsementRequest(url: string, apiKey: string, requestSchemaPayload: object): Promise<object> {
    try {
      const schemaRequest = await this.commonService
        .httpPost(url, requestSchemaPayload, { headers: { 'authorization': apiKey } })
        .then(async response => response);
      return schemaRequest;
    } catch (error) {
      this.logger.error(`Error in schema endorsement request in agent service : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async credDefEndorsementRequest(url: string, apiKey: string, requestSchemaPayload: object): Promise<object> {
    try {
      const credDefRequest = await this.commonService
        .httpPost(url, requestSchemaPayload, { headers: { 'authorization': apiKey } })
        .then(async response => response);
      return credDefRequest;
    } catch (error) {
      this.logger.error(`Error in credential-definition endorsement request in agent service : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async signTransaction(url: string, apiKey: string, signEndorsementPayload: object): Promise<object> {
    try {
      const signEndorsementTransaction = await this.commonService
        .httpPost(url, signEndorsementPayload, { headers: { 'authorization': apiKey } })
        .then(async response => response);

      return signEndorsementTransaction;
    } catch (error) {
      this.logger.error(`Error in sign transaction in agent service : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async sumbitTransaction(url: string, apiKey: string, submitEndorsementPayload: object): Promise<object> {
    try {

      const signEndorsementTransaction = await this.commonService
        .httpPost(url, submitEndorsementPayload, { headers: { 'authorization': apiKey } })
        .then(async response => response);

      return signEndorsementTransaction;
    } catch (error) {
      this.logger.error(`Error in sumbit transaction in agent service : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async outOfBandCredentialOffer(outOfBandIssuancePayload: IOutOfBandCredentialOffer, url: string, apiKey: string): Promise<object> {
    try {
      const sendOutOfbandCredentialOffer = await this.commonService
        .httpPost(url, outOfBandIssuancePayload, { headers: { 'authorization': apiKey } })
        .then(async response => response);
      return sendOutOfbandCredentialOffer;
    } catch (error) {
      this.logger.error(`Error in out-of-band credential in agent service : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async deleteWallet(
    url: string,
    apiKey: string
  ): Promise<object> {
    try {
      const deleteWallet = await this.commonService
        .httpDelete(url, { headers: { 'authorization': apiKey } })
        .then(async response => response);
      return deleteWallet;
    } catch (error) {
      this.logger.error(`Error in delete wallet in agent service : ${JSON.stringify(error)}`);
      throw new RpcException(error);
    }
  }

  async receiveInvitationUrl(receiveInvitationUrl: IReceiveInvitationUrl, url: string, apiKey: string): Promise<string> {
    try {
      const receiveInvitationUrlRes = await this.commonService
        .httpPost(url, receiveInvitationUrl, { headers: { 'authorization': apiKey } })
        .then(async response => response);
      return receiveInvitationUrlRes;
    } catch (error) {
      this.logger.error(`Error in receive invitation in agent service : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async receiveInvitation(receiveInvitation: IReceiveInvitation, url: string, apiKey: string): Promise<string> {
    try {
      const receiveInvitationRes = await this.commonService
        .httpPost(url, receiveInvitation, { headers: { 'authorization': apiKey } })
        .then(async response => response);
      return receiveInvitationRes;
    } catch (error) {
      this.logger.error(`Error in receive invitation in agent service : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getOrgAgentApiKey(orgId: string): Promise<string> {
    try {
      let agentApiKey;
      const orgAgentApiKey = await this.agentServiceRepository.getAgentApiKey(orgId);


      const orgAgentId = await this.agentServiceRepository.getOrgAgentTypeDetails(OrgAgentType.SHARED);
      if (orgAgentApiKey?.orgAgentTypeId === orgAgentId) {
        const platformAdminSpinnedUp = await this.agentServiceRepository.platformAdminAgent(CommonConstants.PLATFORM_ADMIN_ORG);
        
        const [orgAgentData] = platformAdminSpinnedUp.org_agents;
        const { apiKey } = orgAgentData;
        if (!platformAdminSpinnedUp) {
          throw new InternalServerErrorException('Agent not able to spin-up');
        }

        agentApiKey = apiKey;

      } else {
        agentApiKey = orgAgentApiKey?.apiKey;
      }

      if (!agentApiKey) {
        throw new NotFoundException(ResponseMessages.agent.error.apiKeyNotExist);
      }
      await this.cacheService.set(CommonConstants.CACHE_APIKEY_KEY, agentApiKey, CommonConstants.CACHE_TTL_SECONDS);
      return agentApiKey;

    } catch (error) {
      this.logger.error(`Agent api key details : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async handleAgentSpinupStatusErrors(error: string): Promise<object> {
    if (error && Object.keys(error).length === 0) {
      throw new InternalServerErrorException(
        ResponseMessages.agent.error.agentDown,
        { cause: new Error(), description: ResponseMessages.errorMessages.serverError }
      );
    } else {
      throw error;
    }
  }  
}

