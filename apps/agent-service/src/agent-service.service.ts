/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable yoda */
/* eslint-disable no-useless-catch */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
import {
  BadRequestException,
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
import { catchError, map } from 'rxjs/operators';
dotenv.config();
import { GetCredDefAgentRedirection, IAgentSpinupDto, IStoreOrgAgentDetails, ITenantCredDef, ITenantDto, ITenantSchema, IWalletProvision, ISendProofRequestPayload, IIssuanceCreateOffer, OutOfBandCredentialOffer } from './interface/agent-service.interface';
import { AgentSpinUpStatus, AgentType, Ledgers, OrgAgentType } from '@credebl/enum/enum';
import { IConnectionDetails, IUserRequestInterface } from './interface/agent-service.interface';
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

@Injectable()
@WebSocketGateway()
export class AgentServiceService {

  private readonly logger = new Logger('WalletService');

  constructor(
    private readonly agentServiceRepository: AgentServiceRepository,
    private readonly commonService: CommonService,
    private readonly connectionService: ConnectionService,
    @Inject('NATS_CLIENT') private readonly agentServiceProxy: ClientProxy

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


  async walletProvision(agentSpinupDto: IAgentSpinupDto, user: IUserRequestInterface): Promise<{ agentSpinupStatus: number }> {
    let agentProcess: org_agents;
    try {

      this.processWalletProvision(agentSpinupDto, user);
      const agentStatusResponse = {
        agentSpinupStatus: AgentSpinUpStatus.PROCESSED
      };

      return agentStatusResponse;
    } catch (error) {
      this.handleErrorOnWalletProvision(agentSpinupDto, error, agentProcess);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  private async processWalletProvision(agentSpinupDto: IAgentSpinupDto, user: IUserRequestInterface): Promise<void> {
    let platformAdminUser;
    let userId: string;
    let agentProcess: org_agents;
    try {
      const [getOrgAgent, platformConfig, getAgentType, ledgerIdData, orgData] = await Promise.all([
        this.agentServiceRepository.getAgentDetails(agentSpinupDto.orgId),
        this.agentServiceRepository.getPlatformConfigDetails(),
        this.agentServiceRepository.getAgentTypeDetails(),
        this.agentServiceRepository.getLedgerDetails(agentSpinupDto.ledgerName ? agentSpinupDto.ledgerName : [Ledgers.Indicio_Demonet]),
        this.agentServiceRepository.getOrgDetails(agentSpinupDto.orgId)
      ]);

      if (!user?.userId && agentSpinupDto?.platformAdminEmail) {

        platformAdminUser = await this.agentServiceRepository.getPlatfomAdminUser(agentSpinupDto?.platformAdminEmail);

        userId = platformAdminUser?.id;
      } else {
        userId = user?.userId;
      }

      agentSpinupDto.ledgerId = agentSpinupDto.ledgerId?.length ? agentSpinupDto.ledgerId : ledgerIdData.map(ledger => ledger.id);
      const ledgerDetails = await this.agentServiceRepository.getGenesisUrl(agentSpinupDto.ledgerId);

      if (AgentSpinUpStatus.COMPLETED === getOrgAgent?.agentSpinUpStatus) {
        throw new BadRequestException('Your wallet has already been created.');
      }

      if (AgentSpinUpStatus.PROCESSED === getOrgAgent?.agentSpinUpStatus) {
        throw new BadRequestException('Your wallet is already processing.');
      }

      if (!agentSpinupDto.orgId) {
        const platformAdminOrgDetails = await this.agentServiceRepository.getPlatfomOrg(agentSpinupDto?.orgName);

        if (platformAdminOrgDetails) {
          agentSpinupDto.orgId = platformAdminOrgDetails;
        }
      }

      agentSpinupDto.agentType = agentSpinupDto.agentType || getAgentType;
      agentSpinupDto.tenant = agentSpinupDto.tenant || false;
      agentSpinupDto.ledgerName = agentSpinupDto.ledgerName?.length ? agentSpinupDto.ledgerName : [Ledgers.Indicio_Demonet];

      this.validatePlatformConfig(platformConfig);

      const externalIp = platformConfig?.externalIp;
      const controllerIp = platformConfig?.lastInternalId !== 'false' ? platformConfig?.lastInternalId : '';
      const apiEndpoint = platformConfig?.apiEndpoint;

      const walletProvisionPayload = await this.prepareWalletProvisionPayload(agentSpinupDto, externalIp, apiEndpoint, controllerIp, ledgerDetails, platformConfig, orgData);
      const socket: Socket = await this.initSocketConnection(`${process.env.SOCKET_HOST}`);
      this.emitAgentSpinupInitiatedEvent(agentSpinupDto, socket);

      const agentSpinUpStatus = AgentSpinUpStatus.PROCESSED;
      /* eslint-disable no-param-reassign */
      agentProcess = await this.createOrgAgent(agentSpinUpStatus, userId);
      this.validateAgentProcess(agentProcess);

      this._agentSpinup(walletProvisionPayload, agentSpinupDto, platformConfig?.sgApiKey, orgData, user, socket, agentSpinupDto.ledgerId, agentProcess);

    } catch (error) {
      this.handleErrorOnWalletProvision(agentSpinupDto, error, agentProcess);
      throw error;
    }
  }

  validatePlatformConfig(platformConfig: platform_config): void {
    if (!platformConfig) {
      throw new BadRequestException('Platform configuration is missing or invalid.');
    }

    if (!platformConfig.apiEndpoint) {
      throw new BadRequestException('API endpoint is missing in the platform configuration.');
    }

    if (!platformConfig.externalIp) {
      throw new BadRequestException('External IP is missing in the platform configuration.');
    }

    if (typeof platformConfig.externalIp !== 'string') {
      throw new BadRequestException('External IP must be a string.');
    }
  }

  validateAgentProcess(agentProcess: org_agents): void {
    try {
      if (!agentProcess) {
        throw new BadRequestException('Agent process is invalid or not in a completed state.');
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
      orgId: orgData.id,
      externalIp,
      walletName: agentSpinupDto.walletName,
      walletPassword: agentSpinupDto.walletPassword,
      seed: agentSpinupDto.seed,
      webhookEndpoint: apiEndpoint,
      walletStorageHost: process.env.WALLET_STORAGE_HOST || '',
      walletStoragePort: process.env.WALLET_STORAGE_PORT || '',
      walletStorageUser: process.env.WALLET_STORAGE_USER || '',
      walletStoragePassword: process.env.WALLET_STORAGE_PASSWORD || '',
      internalIp: await this._validateInternalIp(platformConfig, controllerIp),
      containerName: orgData.name.split(' ').join('_'),
      agentType: AgentType.AFJ,
      orgName: orgData.name,
      indyLedger: escapedJsonString,
      afjVersion: process.env.AFJ_VERSION || '',
      protocol: process.env.AGENT_PROTOCOL || '',
      tenant: agentSpinupDto.tenant || false
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

  async createOrgAgent(agentSpinUpStatus: AgentSpinUpStatus, userId: string): Promise<org_agents> {
    try {
      const agentProcess = await this.agentServiceRepository.createOrgAgent(agentSpinUpStatus, userId);
      this.logger.log(`Organization agent created with status: ${agentSpinUpStatus}`);
      return agentProcess;
    } catch (error) {

      this.logger.error(`Error creating organization agent: ${error.message}`);
      throw error;
    }
  }

  private async handleErrorOnWalletProvision(agentSpinupDto: IAgentSpinupDto, error: Error, agentProcess: org_agents): Promise<void> {
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

  async _agentSpinup(walletProvisionPayload: IWalletProvision, agentSpinupDto: IAgentSpinupDto, orgApiKey: string, orgData: organisation, user: IUserRequestInterface, socket: Socket, ledgerId: string[], agentProcess: org_agents): Promise<void> {
    try {
      const walletProvision = await this._walletProvision(walletProvisionPayload);

      if (!walletProvision?.response) {
        throw new BadRequestException('Agent not able to spin-up');
      }

      const agentDetails = JSON.parse(walletProvision.response);

      const agentEndPoint = `${process.env.API_GATEWAY_PROTOCOL}://${agentDetails.CONTROLLER_ENDPOINT}`;

      const socket = await this.initSocketConnection(`${process.env.SOCKET_HOST}`);

      if (agentEndPoint && agentSpinupDto.clientSocketId) {
        socket.emit('agent-spinup-process-completed', { clientId: agentSpinupDto.clientSocketId });
        socket.emit('did-publish-process-initiated', { clientId: agentSpinupDto.clientSocketId });
        socket.emit('invitation-url-creation-started', { clientId: agentSpinupDto.clientSocketId });
      }

      const agentPayload: IStoreOrgAgentDetails = {
        agentEndPoint,
        seed: agentSpinupDto.seed,
        apiKey: orgApiKey,
        agentsTypeId: agentSpinupDto?.agentType,
        orgId: orgData.id,
        walletName: agentSpinupDto.walletName,
        clientSocketId: agentSpinupDto.clientSocketId,
        ledgerId,
        did: agentSpinupDto.did,
        id: agentProcess.id
      };

      const storeAgentDetails = await this._storeOrgAgentDetails(agentPayload);

      if (storeAgentDetails) {
        if (agentSpinupDto.clientSocketId) {
          socket.emit('did-publish-process-completed', { clientId: agentSpinupDto.clientSocketId });
        }

        const getOrganization = await this.agentServiceRepository.getOrgDetails(orgData.id);

        await this._createLegacyConnectionInvitation(orgData.id, user, getOrganization.name);

        if (agentSpinupDto.clientSocketId) {
          socket.emit('invitation-url-creation-success', { clientId: agentSpinupDto.clientSocketId });
        }
      } else {
        throw new BadRequestException('Agent not able to spin-up');
      }
    } catch (error) {
      if (agentSpinupDto.clientSocketId) {
        socket.emit('error-in-wallet-creation-process', { clientId: agentSpinupDto.clientSocketId, error });
      }

      if (agentProcess && agentProcess?.id) {
        await this.agentServiceRepository.removeOrgAgent(agentProcess?.id);
      }
      this.logger.error(`[_agentSpinup] - Error in Agent spin up : ${JSON.stringify(error)}`);
    }
  }

  async _storeOrgAgentDetails(payload: IStoreOrgAgentDetails): Promise<object> {
    try {
      const [agentDid, orgAgentTypeId] = await Promise.all([
        this._getAgentDid(payload),
        this.agentServiceRepository.getOrgAgentTypeDetails(OrgAgentType.DEDICATED)
      ]);

      const getDidMethod = await this._getDidMethod(payload, agentDid);
      const storeOrgAgentData = await this._buildStoreOrgAgentData(payload, getDidMethod, orgAgentTypeId);
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
      id: payload.id
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
          return this.commonService.httpPost(agentUrl, { seed, method: indyNamespace, did }, { headers: { 'x-api-key': apiKey } });
        } else if (agentApiState === 'get-did-doc') {
          return this.commonService.httpGet(agentUrl, { headers: { 'x-api-key': apiKey } });
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

  async createTenant(payload: ITenantDto, user: IUserRequestInterface): Promise<{
    agentSpinupStatus: number;
  }> {

    const agentStatusResponse = {
      agentSpinupStatus: AgentSpinUpStatus.PROCESSED
    };

    this._createTenant(payload, user);
    return agentStatusResponse;
  }

  async _createTenant(payload: ITenantDto, user: IUserRequestInterface): Promise<org_agents> {
    let agentProcess;

    try {
      const getOrgAgent = await this.agentServiceRepository.getAgentDetails(payload.orgId);

      if (AgentSpinUpStatus.COMPLETED === getOrgAgent?.agentSpinUpStatus) {
        this.logger.error(`Your wallet has already been created.`);
        throw new BadRequestException('Your wallet has already been created.');
      }

      if (AgentSpinUpStatus.PROCESSED === getOrgAgent?.agentSpinUpStatus) {
        this.logger.error(`Your wallet has already processing.`);
        throw new BadRequestException('Your wallet has already processing.');
      }

      const ledgerIdData = await this.agentServiceRepository.getLedgerDetails(Ledgers.Indicio_Demonet);
      const ledgerIds = ledgerIdData.map(ledger => ledger.id);

      payload.ledgerId = !payload.ledgerId || 0 === payload.ledgerId?.length ? ledgerIds : payload.ledgerId;
      const agentSpinUpStatus = AgentSpinUpStatus.PROCESSED;
      agentProcess = await this.agentServiceRepository.createOrgAgent(agentSpinUpStatus, user.id);


      const platformAdminSpinnedUp = await this.getPlatformAdminAndNotify(payload.clientSocketId);
      const ledgerDetails: ledgers[] = await this.agentServiceRepository.getGenesisUrl(payload.ledgerId);

      for (const iterator of ledgerDetails) {
        const tenantDetails = await this.createTenantAndNotify(payload, iterator, platformAdminSpinnedUp);

        if (AgentSpinUpStatus.COMPLETED !== platformAdminSpinnedUp.org_agents[0].agentSpinUpStatus) {
          throw new NotFoundException('Platform-admin agent is not spun-up');
        }

        const orgAgentTypeId = await this.agentServiceRepository.getOrgAgentTypeDetails(OrgAgentType.SHARED);
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
          id: agentProcess.id
        };

        const getOrganization = await this.agentServiceRepository.getOrgDetails(payload.orgId);

        this.notifyClientSocket('agent-spinup-process-completed', payload.clientSocketId);
        const saveTenant = await this.agentServiceRepository.storeOrgAgentDetails(storeOrgAgentData);

        this.notifyClientSocket('invitation-url-creation-started', payload.clientSocketId);
        this._createLegacyConnectionInvitation(payload.orgId, user, getOrganization.name);

        this.notifyClientSocket('invitation-url-creation-success', payload.clientSocketId);

        return saveTenant;
      }
    } catch (error) {
      this.handleError(error, payload.clientSocketId);

      if (agentProcess && agentProcess?.id) {
        this.agentServiceRepository.removeOrgAgent(agentProcess?.id);
      }

      throw new RpcException(error.response ? error.response : error);
    }
  }

  private async getPlatformAdminAndNotify(clientSocketId: string | undefined): Promise<organisation & { org_agents: org_agents[] }> {
    const socket = await this.createSocketInstance();
    if (clientSocketId) {
      socket.emit('agent-spinup-process-initiated', { clientId: clientSocketId });
    }

    const platformAdminSpinnedUp = await this.agentServiceRepository.platformAdminAgent(CommonConstants.PLATFORM_ADMIN_ORG);

    if (!platformAdminSpinnedUp) {
      throw new InternalServerErrorException('Agent not able to spin-up');
    }

    return platformAdminSpinnedUp;
  }

  private async createTenantAndNotify(payload: ITenantDto, ledgerIds: ledgers, platformAdminSpinnedUp: organisation & { org_agents: org_agents[] }): Promise<object> {
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

    const apiKey = '';
    const tenantDetails = await this.commonService.httpPost(
      `${platformAdminSpinnedUp.org_agents[0].agentEndPoint}${CommonConstants.URL_SHAGENT_CREATE_TENANT}`,
      createTenantOptions,
      { headers: { 'x-api-key': apiKey } }
    );

    this.logger.debug(`API Response Data: ${JSON.stringify(tenantDetails)}`);
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
        schemaResponse = await this.commonService.httpPost(url, schemaPayload, { headers: { 'x-api-key': payload.apiKey } })
          .then(async (schema) => {
            this.logger.debug(`API Response Data: ${JSON.stringify(schema)}`);
            return schema;
          });

      } else if (OrgAgentType.SHARED === payload.agentType) {

        const url = `${payload.agentEndPoint}${CommonConstants.URL_SHAGENT_CREATE_SCHEMA}`.replace('#', `${payload.tenantId}`);
        const schemaPayload = {
          attributes: payload.payload.attributes,
          version: payload.payload.version,
          name: payload.payload.name,
          issuerId: payload.payload.issuerId
        };
        schemaResponse = await this.commonService.httpPost(url, schemaPayload, { headers: { 'x-api-key': payload.apiKey } })
          .then(async (schema) => {
            this.logger.debug(`API Response Data: ${JSON.stringify(schema)}`);
            return schema;
          });
      }
      return schemaResponse;
    } catch (error) {
      this.logger.error(`Error in creating schema: ${error}`);
      throw error;
    }
  }

  async getSchemaById(payload: GetSchemaAgentRedirection): Promise<object> {
    try {
      let schemaResponse;

      if (OrgAgentType.DEDICATED === payload.agentType) {
        const url = `${payload.agentEndPoint}${CommonConstants.URL_SCHM_GET_SCHEMA_BY_ID.replace('#', `${payload.schemaId}`)}`;
        schemaResponse = await this.commonService.httpGet(url, payload.schemaId)
          .then(async (schema) => {
            this.logger.debug(`API Response Data: ${JSON.stringify(schema)}`);
            return schema;
          });

      } else if (OrgAgentType.SHARED === payload.agentType) {
        const url = `${payload.agentEndPoint}${CommonConstants.URL_SHAGENT_GET_SCHEMA}`.replace('@', `${payload.payload.schemaId}`).replace('#', `${payload.tenantId}`);

        schemaResponse = await this.commonService.httpGet(url, { headers: { 'x-api-key': payload.apiKey } })
          .then(async (schema) => {
            this.logger.debug(`API Response Data: ${JSON.stringify(schema)}`);
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

        credDefResponse = await this.commonService.httpPost(url, credDefPayload, { headers: { 'x-api-key': payload.apiKey } })
          .then(async (credDef) => {
            this.logger.debug(`API Response Data: ${JSON.stringify(credDef)}`);
            return credDef;
          });

      } else if (OrgAgentType.SHARED === payload.agentType) {
        const url = `${payload.agentEndPoint}${CommonConstants.URL_SHAGENT_CREATE_CRED_DEF}`.replace('#', `${payload.tenantId}`);
        const credDefPayload = {
          tag: payload.payload.tag,
          schemaId: payload.payload.schemaId,
          issuerId: payload.payload.issuerId
        };
        credDefResponse = await this.commonService.httpPost(url, credDefPayload, { headers: { 'x-api-key': payload.apiKey } })
          .then(async (credDef) => {
            this.logger.debug(`API Response Data: ${JSON.stringify(credDef)}`);
            return credDef;
          });
      }

      return credDefResponse;
    } catch (error) {
      this.logger.error(`Error in creating credential definition: ${error}`);
      throw error;
    }
  }

  async getCredentialDefinitionById(payload: GetCredDefAgentRedirection): Promise<object> {
    try {
      let credDefResponse;

      if (OrgAgentType.DEDICATED === payload.agentType) {
        const url = `${payload.agentEndPoint}${CommonConstants.URL_SCHM_GET_CRED_DEF_BY_ID.replace('#', `${payload.credentialDefinitionId}`)}`;
        credDefResponse = await this.commonService.httpGet(url, payload.credentialDefinitionId)
          .then(async (credDef) => {
            this.logger.debug(`API Response Data: ${JSON.stringify(credDef)}`);
            return credDef;
          });

      } else if (OrgAgentType.SHARED === payload.agentType) {
        const url = `${payload.agentEndPoint}${CommonConstants.URL_SHAGENT_GET_CRED_DEF}`.replace('@', `${payload.payload.credentialDefinitionId}`).replace('#', `${payload.tenantId}`);
        credDefResponse = await this.commonService.httpGet(url, { headers: { 'x-api-key': payload.apiKey } })
          .then(async (credDef) => {
            this.logger.debug(`API Response Data: ${JSON.stringify(credDef)}`);
            return credDef;
          });
      }
      return credDefResponse;
    } catch (error) {
      this.logger.error(`Error in getting schema: ${error}`);
      throw error;
    }
  }

  async createLegacyConnectionInvitation(connectionPayload: IConnectionDetails, url: string, apiKey: string): Promise<object> {
    try {

      const data = await this.commonService
        .httpPost(url, connectionPayload, { headers: { 'x-api-key': apiKey } })
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
        .httpPost(url, issueData, { headers: { 'x-api-key': apiKey } })
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
        .httpGet(url, { headers: { 'x-api-key': apiKey } })
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
        .httpGet(url, { headers: { 'x-api-key': apiKey } })
        .then(async response => response);
      return data;
    } catch (error) {
      this.logger.error(`Error in getIssueCredentials in agent service : ${JSON.stringify(error)}`);
      throw error;
    }
  }
  async getProofPresentationById(url: string, apiKey: string): Promise<object> {
    try {
      const getProofPresentationById = await this.commonService
        .httpGet(url, { headers: { 'x-api-key': apiKey } })
        .then(async response => response);
      return getProofPresentationById;
    } catch (error) {
      this.logger.error(`Error in proof presentation by id in agent service : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getIssueCredentialsbyCredentialRecordId(url: string, apiKey: string): Promise<object> {
    try {
      const data = await this.commonService
        .httpGet(url, { headers: { 'x-api-key': apiKey } })
        .then(async response => response);
      return data;
    } catch (error) {
      this.logger.error(`Error in getIssueCredentialsbyCredentialRecordId in agent service : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async sendProofRequest(proofRequestPayload: ISendProofRequestPayload, url: string, apiKey: string): Promise<object> {
    try {
      const sendProofRequest = await this.commonService
        .httpPost(url, proofRequestPayload, { headers: { 'x-api-key': apiKey } })
        .then(async response => response);
      return sendProofRequest;
    } catch (error) {
      this.logger.error(`Error in send proof request in agent service : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async verifyPresentation(url: string, apiKey: string): Promise<object> {
    try {
      const verifyPresentation = await this.commonService
        .httpPost(url, '', { headers: { 'x-api-key': apiKey } })
        .then(async response => response);
      return verifyPresentation;
    } catch (error) {
      this.logger.error(`Error in verify proof presentation in agent service : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getConnections(url: string, apiKey: string): Promise<object> {
    try {
      const data = await this.commonService
        .httpGet(url, { headers: { 'x-api-key': apiKey } })
        .then(async response => response);
      return data;
    } catch (error) {
      this.logger.error(`Error in getConnections in agent service : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getConnectionsByconnectionId(url: string, apiKey: string): Promise<object> {
    try {
      const data = await this.commonService
        .httpGet(url, { headers: { 'x-api-key': apiKey } })
        .then(async response => response);

      return data;
    } catch (error) {
      this.logger.error(`Error in getConnectionsByconnectionId in agent service : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getAgentHealthDetails(orgId: string): Promise<object> {
    try {
      const orgAgentDetails: org_agents = await this.agentServiceRepository.getOrgAgentDetails(orgId);

      if (!orgAgentDetails) {
        throw new NotFoundException(ResponseMessages.agent.error.agentNotExists);
      }
      if (orgAgentDetails.agentEndPoint) {
        const data = await this.commonService
          .httpGet(`${orgAgentDetails.agentEndPoint}/agent`, { headers: { 'x-api-key': '' } })
          .then(async response => response);
        return data;
      } else {
        throw new NotFoundException(ResponseMessages.agent.error.agentUrl);
      }

    } catch (error) {
      this.logger.error(`Agent health details : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async sendOutOfBandProofRequest(proofRequestPayload: ISendProofRequestPayload, url: string, apiKey: string): Promise<object> {
    try {
      const sendProofRequest = await this.commonService
        .httpPost(url, proofRequestPayload, { headers: { 'x-api-key': apiKey } })
        .then(async response => response);
      return sendProofRequest;
    } catch (error) {
      this.logger.error(`Error in send out of band proof request in agent service : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getProofFormData(url: string, apiKey: string): Promise<object> {
    try {
      const getProofFormData = await this.commonService
        .httpGet(url, { headers: { 'x-api-key': apiKey } })
        .then(async response => response);
      return getProofFormData;
    } catch (error) {
      this.logger.error(`Error in get proof form data in agent service : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async schemaEndorsementRequest(url: string, apiKey: string, requestSchemaPayload: object): Promise<object> {
    try {
      const schemaRequest = await this.commonService
        .httpPost(url, requestSchemaPayload, { headers: { 'x-api-key': apiKey } })
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
        .httpPost(url, requestSchemaPayload, { headers: { 'x-api-key': apiKey } })
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
        .httpPost(url, signEndorsementPayload, { headers: { 'x-api-key': apiKey } })
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
        .httpPost(url, submitEndorsementPayload, { headers: { 'x-api-key': apiKey } })
        .then(async response => response);

      return signEndorsementTransaction;
    } catch (error) {
      this.logger.error(`Error in sumbit transaction in agent service : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async outOfBandCredentialOffer(outOfBandIssuancePayload: OutOfBandCredentialOffer, url: string, apiKey: string): Promise<object> {
    try {
      const sendOutOfbandCredentialOffer = await this.commonService
        .httpPost(url, outOfBandIssuancePayload, { headers: { 'x-api-key': apiKey } })
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
        .httpDelete(url, { headers: { 'x-api-key': apiKey } })
        .then(async response => response);
      return deleteWallet;
    } catch (error) {
      this.logger.error(`Error in delete wallet in agent service : ${JSON.stringify(error)}`);
      throw new RpcException(error);
    }
  }
}

