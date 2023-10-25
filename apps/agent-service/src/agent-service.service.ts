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
import { catchError, map } from 'rxjs/operators';
dotenv.config();
import { GetCredDefAgentRedirection, IAgentSpinupDto, IStoreOrgAgentDetails, ITenantCredDef, ITenantDto, ITenantSchema, IWalletProvision, ISendProofRequestPayload, IIssuanceCreateOffer } from './interface/agent-service.interface';
import { AgentType, OrgAgentType } from '@credebl/enum/enum';
import { IConnectionDetails, IUserRequestInterface } from './interface/agent-service.interface';
import { AgentServiceRepository } from './repositories/agent-service.repository';
import { ledgers, org_agents, organisation, platform_config } from '@prisma/client';
import { CommonConstants } from '@credebl/common/common.constant';
import { CommonService } from '@credebl/common';
import { v4 as uuidv4 } from 'uuid';
import { GetSchemaAgentRedirection } from 'apps/ledger/src/schema/schema.interface';
import { ConnectionService } from 'apps/connection/src/connection.service';
import { ResponseMessages } from '@credebl/common/response-messages';
import { io } from 'socket.io-client';
import { WebSocketGateway } from '@nestjs/websockets';
import * as retry from 'async-retry';
import { user } from '@prisma/client';

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

  async walletProvision(agentSpinupDto: IAgentSpinupDto, user: IUserRequestInterface): Promise<{
    agentSpinupStatus: number;
  }> {
    try {

      agentSpinupDto.agentType = agentSpinupDto.agentType ? agentSpinupDto.agentType : 1;
      agentSpinupDto.tenant = agentSpinupDto.tenant ? agentSpinupDto.tenant : false;
      agentSpinupDto.ledgerId = !agentSpinupDto.ledgerId || 0 === agentSpinupDto.ledgerId.length ? [1] : agentSpinupDto.ledgerId;


      const platformConfig: platform_config = await this.agentServiceRepository.getPlatformConfigDetails();
      const ledgerDetails: ledgers[] = await this.agentServiceRepository.getGenesisUrl(agentSpinupDto.ledgerId);
      const orgData: organisation = await this.agentServiceRepository.getOrgDetails(agentSpinupDto.orgId);

      if (!orgData) {
        this.logger.error(ResponseMessages.agent.error.orgNotFound);
        throw new NotFoundException(ResponseMessages.agent.error.orgNotFound);
      }

      const getOrgAgent = await this.agentServiceRepository.getAgentDetails(agentSpinupDto.orgId);

      if (2 === getOrgAgent?.agentSpinUpStatus) {
        this.logger.error(`Agent already exists.`);
        throw new NotFoundException('Agent already exists');
      }

      const orgApiKey: string = platformConfig?.sgApiKey;

      const containerName: string = uuidv4();

      if (fs.existsSync(`./apps/agent-provisioning/AFJ/endpoints/${agentSpinupDto.orgId}_${containerName}.json`)) {
        fs.unlinkSync(`./apps/agent-provisioning/AFJ/endpoints/${agentSpinupDto.orgId}_${containerName}.json`);
      }

      if (!platformConfig?.apiEndpoint) {
        this.logger.error(ResponseMessages.agent.error.apiEndpointNotFound);
        throw new BadRequestException(ResponseMessages.agent.error.apiEndpointNotFound);
      }

      const externalIp: string = platformConfig?.externalIp;
      const controllerIp: string = ('false' !== platformConfig?.lastInternalId) ? (platformConfig?.lastInternalId) : '';

      const apiEndpoint: string = platformConfig?.apiEndpoint;
      const { WALLET_STORAGE_HOST } = process.env;
      const { WALLET_STORAGE_PORT } = process.env;
      const { WALLET_STORAGE_USER } = process.env;
      const { WALLET_STORAGE_PASSWORD } = process.env;

      const internalIp: string = await this._validateInternalIp(
        platformConfig,
        controllerIp
      );

      const ledgerArray = [];
      for (const iterator of ledgerDetails) {
        const ledgerJson = {};

        ledgerJson["genesisTransactions"] = iterator.poolConfig;
        ledgerJson["indyNamespace"] = iterator.indyNamespace;

        ledgerArray.push(ledgerJson);
      }

      const ledgerString = JSON.stringify(ledgerArray);
      const escapedJsonString = ledgerString.replace(/"/g, '\\"');
      if (agentSpinupDto.agentType === AgentType.ACAPY) {

        // TODO: ACA-PY Agent Spin-Up
      } else if (agentSpinupDto.agentType === AgentType.AFJ) {

        const walletProvisionPayload: IWalletProvision = {
          orgId: `${orgData.id}`,
          externalIp,
          walletName: agentSpinupDto.walletName,
          walletPassword: agentSpinupDto.walletPassword,
          seed: agentSpinupDto.seed,
          webhookEndpoint: apiEndpoint,
          walletStorageHost: WALLET_STORAGE_HOST,
          walletStoragePort: WALLET_STORAGE_PORT,
          walletStorageUser: WALLET_STORAGE_USER,
          walletStoragePassword: WALLET_STORAGE_PASSWORD,
          internalIp,
          containerName,
          agentType: AgentType.AFJ,
          orgName: orgData.name,
          indyLedger: escapedJsonString,
          afjVersion: process.env.AFJ_VERSION,
          protocol: process.env.AGENT_PROTOCOL,
          tenant: agentSpinupDto.tenant
        };

        const socket = await io(`${process.env.SOCKET_HOST}`, {
          reconnection: true,
          reconnectionDelay: 5000,
          reconnectionAttempts: Infinity,
          autoConnect: true,
          transports: ['websocket']
        });

        if (agentSpinupDto.clientSocketId) {
          socket.emit('agent-spinup-process-initiated', { clientId: agentSpinupDto.clientSocketId });
        }

        await this._agentSpinup(walletProvisionPayload, agentSpinupDto, orgApiKey, orgData, user, socket, agentSpinupDto.ledgerId);
        const agentStatusResponse = {
          agentSpinupStatus: 1
        };

        return agentStatusResponse;
      }
    } catch (error) {
      if (agentSpinupDto.clientSocketId) {
        const socket = await io(`${process.env.SOCKET_HOST}`, {
          reconnection: true,
          reconnectionDelay: 5000,
          reconnectionAttempts: Infinity,
          autoConnect: true,
          transports: ['websocket']
        });
        socket.emit('error-in-wallet-creation-process', { clientId: agentSpinupDto.clientSocketId, error });
      }
      this.logger.error(`Error in Agent spin up : ${JSON.stringify(error)}`);
    }
  }

  async _agentSpinup(walletProvisionPayload: IWalletProvision, agentSpinupDto: IAgentSpinupDto, orgApiKey: string, orgData: organisation, user: IUserRequestInterface, socket, ledgerId: number[]): Promise<void> {
    try {
      const agentSpinUpResponse = new Promise(async (resolve, _reject) => {

        const walletProvision: {
          response
        } = await this._walletProvision(walletProvisionPayload);

        if (!walletProvision?.response) {
          throw new InternalServerErrorException('Agent not able to spin-up');
        } else {
          resolve(walletProvision?.response);
        }

        return agentSpinUpResponse.then(async (agentDetails) => {
          if (agentDetails) {
            const controllerEndpoints = JSON.parse(agentDetails);
            const agentEndPoint = `${process.env.API_GATEWAY_PROTOCOL}://${controllerEndpoints.CONTROLLER_ENDPOINT}`;

            if (agentEndPoint && agentSpinupDto.clientSocketId) {
              const socket = io(`${process.env.SOCKET_HOST}`, {
                reconnection: true,
                reconnectionDelay: 5000,
                reconnectionAttempts: Infinity,
                autoConnect: true,
                transports: ['websocket']
              });
              socket.emit('agent-spinup-process-completed', { clientId: agentSpinupDto.clientSocketId });
            }

            const agentPayload: IStoreOrgAgentDetails = {
              agentEndPoint,
              seed: agentSpinupDto.seed,
              apiKey: orgApiKey,
              agentsTypeId: AgentType.AFJ,
              orgId: orgData.id,
              walletName: agentSpinupDto.walletName,
              clientSocketId: agentSpinupDto.clientSocketId,
              ledgerId
            };

            if (agentEndPoint && agentSpinupDto.clientSocketId) {
              socket.emit('did-publish-process-initiated', { clientId: agentSpinupDto.clientSocketId });
            }
            const storeAgentDetails = await this._storeOrgAgentDetails(agentPayload);
            if (agentSpinupDto.clientSocketId) {
              socket.emit('did-publish-process-completed', { clientId: agentSpinupDto.clientSocketId });
            }

            if (storeAgentDetails) {
              if (agentSpinupDto.clientSocketId) {
                socket.emit('invitation-url-creation-started', { clientId: agentSpinupDto.clientSocketId });
              }
              await this._createLegacyConnectionInvitation(orgData.id, user, agentPayload.walletName);
              if (agentSpinupDto.clientSocketId) {
                socket.emit('invitation-url-creation-success', { clientId: agentSpinupDto.clientSocketId });
              }
            }
            resolve(storeAgentDetails);
          } else {
            throw new InternalServerErrorException('Agent not able to spin-up');
          }
        })
          .catch((error) => {
            _reject(error);
          });
      });
    } catch (error) {
      if (agentSpinupDto.clientSocketId) {
        const socket = await io(`${process.env.SOCKET_HOST}`, {
          reconnection: true,
          reconnectionDelay: 5000,
          reconnectionAttempts: Infinity,
          autoConnect: true,
          transports: ['websocket']
        });
        socket.emit('error-in-wallet-creation-process', { clientId: agentSpinupDto.clientSocketId, error });
      }
      this.logger.error(`[_agentSpinup] - Error in Agent spin up : ${JSON.stringify(error)}`);
    }
  }

  async _storeOrgAgentDetails(payload: IStoreOrgAgentDetails): Promise<object> {
    try {


      const agentDidWriteUrl = `${payload.agentEndPoint}${CommonConstants.URL_AGENT_WRITE_DID}`;
      const { seed } = payload;
      const { apiKey } = payload;
      const writeDid = 'write-did';
      const agentDid = await this._retryAgentSpinup(agentDidWriteUrl, apiKey, writeDid, seed);
      if (agentDid) {

        const getDidMethodUrl = `${payload.agentEndPoint}${CommonConstants.URL_AGENT_GET_DIDS}`;
        const getDidDic = 'get-did-doc';
        const getDidMethod = await this._retryAgentSpinup(getDidMethodUrl, apiKey, getDidDic);


        const storeOrgAgentData: IStoreOrgAgentDetails = {
          did: getDidMethod[0]?.did,
          verkey: getDidMethod[0]?.didDocument?.verificationMethod[0]?.publicKeyBase58,
          isDidPublic: true,
          agentSpinUpStatus: 2,
          walletName: payload.walletName,
          agentsTypeId: AgentType.AFJ,
          orgId: payload.orgId,
          agentEndPoint: payload.agentEndPoint,
          agentId: payload.agentId,
          orgAgentTypeId: OrgAgentType.DEDICATED,
          ledgerId: payload.ledgerId
        };


        const storeAgentDid = await this.agentServiceRepository.storeOrgAgentDetails(storeOrgAgentData);
        return storeAgentDid;

      } else {
        throw new InternalServerErrorException('DID is not registered on the ledger');
      }


    } catch (error) {
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
      this.logger.error(`[_storeOrgAgentDetails] - Error in store agent details : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async _retryAgentSpinup(agentUrl: string, apiKey: string, agentApiState: string, seed?: string): Promise<object> {
    return retry(
      async () => {

        if ('write-did' === agentApiState) {

          const agentDid = await this.commonService
            .httpPost(agentUrl, { seed }, { headers: { 'x-api-key': apiKey } })
            .then(async response => response);
          return agentDid;
        } else if ('get-did-doc' === agentApiState) {

          const getDidMethod = await this.commonService
            .httpGet(agentUrl, { headers: { 'x-api-key': apiKey } })
            .then(async response => response);
          return getDidMethod;
        }
      },
      {
        retries: 10
      }
    );
  }

  async _createLegacyConnectionInvitation(orgId: number, user: IUserRequestInterface, label: string): Promise<{
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
      agentSpinupStatus: 1
    };

    await this._createTenant(payload, user);

    return agentStatusResponse;
  }

  async _createTenant(payload: ITenantDto, user: IUserRequestInterface): Promise<void> {
    try {

      payload.ledgerId = !payload.ledgerId || 0 === payload.ledgerId.length ? [1] : payload.ledgerId;

      const ledgerDetails: ledgers[] = await this.agentServiceRepository.getGenesisUrl(payload.ledgerId);
      const sharedAgentSpinUpResponse = new Promise(async (resolve, _reject) => {

        const socket = await io(`${process.env.SOCKET_HOST}`, {
          reconnection: true,
          reconnectionDelay: 5000,
          reconnectionAttempts: Infinity,
          autoConnect: true,
          transports: ['websocket']
        });

        if (payload.clientSocketId) {
          socket.emit('agent-spinup-process-initiated', { clientId: payload.clientSocketId });
        }
        const platformAdminSpinnedUp = await this.agentServiceRepository.platformAdminAgent(parseInt(process.env.PLATFORM_ID));

        if (!platformAdminSpinnedUp) {
          throw new InternalServerErrorException('Agent not able to spin-up');
        } else {
          resolve(platformAdminSpinnedUp);
        }

        return sharedAgentSpinUpResponse.then(async (agentDetails) => {
          if (agentDetails) {
            if (2 !== platformAdminSpinnedUp.org_agents[0].agentSpinUpStatus) {
              throw new NotFoundException('Platform-admin agent is not spun-up');
            }

            let tenantDetails;
            const url = `${platformAdminSpinnedUp.org_agents[0].agentEndPoint}${CommonConstants.URL_SHAGENT_CREATE_TENANT}`;
            for (const iterator of ledgerDetails) {
              const { label, seed } = payload;
              const createTenantOptions = {
                config: {
                  label
                },
                seed,
                method: iterator.indyNamespace
              };
              const apiKey = '';
              tenantDetails = await this.commonService
                .httpPost(url, createTenantOptions, { headers: { 'x-api-key': apiKey } })
                .then(async (tenant) => {
                  this.logger.debug(`API Response Data: ${JSON.stringify(tenant)}`);
                  return tenant;
                });

              const storeOrgAgentData: IStoreOrgAgentDetails = {
                did: tenantDetails.did,
                verkey: tenantDetails.verkey,
                isDidPublic: true,
                agentSpinUpStatus: 2,
                agentsTypeId: AgentType.AFJ,
                orgId: payload.orgId,
                agentEndPoint: platformAdminSpinnedUp.org_agents[0].agentEndPoint,
                orgAgentTypeId: OrgAgentType.SHARED,
                tenantId: tenantDetails.tenantRecord.id,
                walletName: label,
                ledgerId: payload.ledgerId
              };

              if (payload.clientSocketId) {
                socket.emit('agent-spinup-process-completed', { clientId: payload.clientSocketId });
              }

              const saveTenant = await this.agentServiceRepository.storeOrgAgentDetails(storeOrgAgentData);

              if (payload.clientSocketId) {
                socket.emit('invitation-url-creation-started', { clientId: payload.clientSocketId });
              }

              await this._createLegacyConnectionInvitation(payload.orgId, user, storeOrgAgentData.walletName);

              if (payload.clientSocketId) {
                socket.emit('invitation-url-creation-success', { clientId: payload.clientSocketId });
              }

              resolve(saveTenant);
            }

          } else {
            throw new InternalServerErrorException('Agent not able to spin-up');
          }
        })
          .catch(async (error) => {
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
            _reject(error);
          });
      });
    } catch (error) {
      this.logger.error(`Error in creating tenant: ${error}`);
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
      throw new RpcException(error.response ? error.response : error);
    }
  }


  async createSchema(payload: ITenantSchema): Promise<object> {
    try {
      let schemaResponse;

      if (1 === payload.agentType) {

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

      } else if (2 === payload.agentType) {

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

      if (1 === payload.agentType) {
        const url = `${payload.agentEndPoint}${CommonConstants.URL_SCHM_GET_SCHEMA_BY_ID.replace('#', `${payload.schemaId}`)}`;
        schemaResponse = await this.commonService.httpGet(url, payload.schemaId)
          .then(async (schema) => {
            this.logger.debug(`API Response Data: ${JSON.stringify(schema)}`);
            return schema;
          });

      } else if (2 === payload.agentType) {
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
      if (1 === payload.agentType) {
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

      } else if (2 === payload.agentType) {
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

      if (1 === payload.agentType) {
        const url = `${payload.agentEndPoint}${CommonConstants.URL_SCHM_GET_CRED_DEF_BY_ID.replace('#', `${payload.credentialDefinitionId}`)}`;
        credDefResponse = await this.commonService.httpGet(url, payload.credentialDefinitionId)
          .then(async (credDef) => {
            this.logger.debug(`API Response Data: ${JSON.stringify(credDef)}`);
            return credDef;
          });

      } else if (2 === payload.agentType) {
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
      throw new RpcException(error.response ? error.response : error);
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
      throw new RpcException(error.response ? error.response : error);
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
      throw new RpcException(error.response ? error.response : error);
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
      throw new RpcException(error.response ? error.response : error);
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
      throw new RpcException(error.response ? error.response : error);
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
    }
  }

  async getAgentHealthDetails(orgId: number): Promise<object> {
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
      throw new RpcException(error.response ? error.response : error);
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
      throw new RpcException(error.response ? error.response : error);
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
      throw new RpcException(error.response ? error.response : error);
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
      throw new RpcException(error.response ? error.response : error);
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
      throw new RpcException(error.response ? error.response : error);
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
      throw new RpcException(error.response ? error.response : error);
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
      throw new RpcException(error.response ? error.response : error);
    }
  }

}

