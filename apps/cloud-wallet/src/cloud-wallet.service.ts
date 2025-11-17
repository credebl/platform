/* eslint-disable camelcase */
import { CommonService } from '@credebl/common';
import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  IAcceptOffer,
  ICreateCloudWalletDid,
  IReceiveInvitation,
  IAcceptProofRequest,
  IProofRequestRes,
  ICloudBaseWalletConfigure,
  ICloudWalletDetails,
  ICreateCloudWallet,
  IGetProofPresentation,
  IGetProofPresentationById,
  IGetStoredWalletInfo,
  IStoredWalletDetails,
  CloudWallet,
  IStoreWalletInfo,
  IWalletDetailsForDidList,
  IConnectionDetailsById,
  ITenantDetail,
  ICredentialDetails,
  ICreateConnection, 
  IConnectionInvitationResponse,
  GetAllCloudWalletConnections,
  IBasicMessage,
  IBasicMessageDetails,
  IProofPresentationDetails,
  IGetCredentialsForRequest,
  ICredentialForRequestRes,
  IProofPresentationPayloadWithCred,
  IDeclineProofRequest,
  BaseAgentInfo,
  ISelfAttestedCredential,
  IW3cCredentials,
  IDeleteCloudWallet,
  ICheckCloudWalletStatus,
  IExportCloudWallet,
  IAddConnectionType
} from '@credebl/common/interfaces/cloud-wallet.interface';
import { CloudWalletRepository } from './cloud-wallet.repository';
import { ResponseMessages } from '@credebl/common/response-messages';
import { CloudWalletType } from '@credebl/enum/enum';
import { CommonConstants } from '@credebl/common/common.constant';
import { cloud_wallet_user_info, user } from '@prisma/client';
import { UpdateBaseWalletDto } from 'apps/api-gateway/src/cloud-wallet/dtos/cloudWallet.dto';
// import { ClientRegistrationService } from '@credebl/client-registration';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const md5 = require('md5');

@Injectable()
export class CloudWalletService {
  constructor(
    private readonly commonService: CommonService,
    @Inject('NATS_CLIENT') private readonly cloudWalletServiceProxy: ClientProxy,
    private readonly cloudWalletRepository: CloudWalletRepository,
    private readonly logger: Logger,
    @Inject(CACHE_MANAGER) private cacheService: Cache
  ) {}

  /**
   * configure cloud base wallet
   * @param configureBaseWalletPayload
   * @returns cloud base wallet
   */
  async configureBaseWallet(configureBaseWalletPayload: ICloudBaseWalletConfigure): Promise<IGetStoredWalletInfo> {
    const { agentEndpoint, apiKey, email, walletKey, userId, maxSubWallets } = configureBaseWalletPayload;

    try {
      const getAgentInfo = await this.commonService.httpGet(
        `${agentEndpoint}${CommonConstants.URL_AGENT_GET_ENDPOINT}`
      );
      if (!getAgentInfo?.isInitialized) {
        throw new BadRequestException(ResponseMessages.cloudWallet.error.notReachable);
      }

      // const existingWalletInfo = await this.cloudWalletRepository.getCloudWalletInfo(userId);
      // if (existingWalletInfo) {
      //   throw new ConflictException(ResponseMessages.cloudWallet.error.agentAlreadyExist);
      // }

      const [encryptionWalletKey, encryptionApiKey] = await Promise.all([
        this.commonService.dataEncryption(walletKey),
        this.commonService.dataEncryption(apiKey)
      ]);

      const walletInfoToStore: IStoreWalletInfo = {
        agentEndpoint,
        agentApiKey: encryptionApiKey,
        email,
        type: CloudWalletType.BASE_WALLET,
        userId: null,
        key: encryptionWalletKey,
        createdBy: userId,
        lastChangedBy: userId,
        maxSubWallets
      };

      const storedWalletInfo = await this.cloudWalletRepository.storeCloudWalletInfo(walletInfoToStore);
      return storedWalletInfo;
    } catch (error) {
      await this.commonService.handleError(error);
      throw error;
    }
  }

    /**
   * Check cloud wallet status
   * @param checkCloudWalletStatus 
   * @returns connection details
   */
  async checkCloudWalletStatus(checkCloudWalletStatus: ICheckCloudWalletStatus): Promise<IConnectionInvitationResponse> {
    try {

      const { userId } = checkCloudWalletStatus;
        const [getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);

        delete checkCloudWalletStatus.email;

        const { tenantId } = getTenant;
        const { agentEndpoint } = getTenant;

        const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_CHECK_CLOUD_WALLET_EXISTS}/${tenantId}`;
        
        const checkCloudWalletExists = await this.commonService.httpGet(url, { headers: { authorization: decryptedApiKey } });       
        return checkCloudWalletExists;
    } catch (error) {
      await this.commonService.handleError(error);
      throw error;
    }
  }

  /**
   * Create connection
   * @param createConnection 
   * @returns connection details
   */
  async createConnection(createConnection: ICreateConnection): Promise<IConnectionInvitationResponse> {
    try {

      const { userId, ...connectionPayload } = createConnection;
        const [getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);

        delete connectionPayload.email;

        const { tenantId } = getTenant;
        const { agentEndpoint } = getTenant;

        const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_CREATE_CONNECTION_INVITATION}/${tenantId}`;
        
        const createConnectionDetails = await this.commonService.httpPost(url, connectionPayload, { headers: { authorization: decryptedApiKey } });       
        return createConnectionDetails;
    } catch (error) {
      await this.commonService.handleError(error);
      throw error;
    }
  }

  /**
   * Accept proof request
   * @param acceptProofRequest
   * @returns proof presentation
   */
  async acceptProofRequest(acceptProofRequest: IAcceptProofRequest): Promise<IProofRequestRes> {
    const { proofRecordId, comment, filterByNonRevocationRequirements, filterByPresentationPreview, userId } =
      acceptProofRequest;
    try {
      const [getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);

      const { tenantId } = getTenant;
      const { agentEndpoint } = getTenant;

      const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_GET_PROOF_REQUEST}/${proofRecordId}${CommonConstants.CLOUD_WALLET_ACCEPT_PROOF_REQUEST}${tenantId}`;
      const proofAcceptRequestPayload = {
        comment,
        filterByNonRevocationRequirements,
        filterByPresentationPreview
      };

      const acceptProofRequest = await this.commonService.httpPost(url, proofAcceptRequestPayload, {
        headers: { authorization: decryptedApiKey }
      });
      return acceptProofRequest;
    } catch (error) {
      await this.commonService.handleError(error);
      throw error;
    }
  }

  /**
   * Decline proof request
   * @param declineProofRequest
   * @returns proof presentation
   */
  async declineProofRequest(declineProofRequest: IDeclineProofRequest): Promise<IProofRequestRes> {
    const { proofRecordId, sendProblemReport, problemReportDescription, userId } =
      declineProofRequest;
    try {
      const [getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);

      const { tenantId } = getTenant;
      const { agentEndpoint } = getTenant;

      const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_GET_PROOF_REQUEST}/${proofRecordId}${CommonConstants.CLOUD_WALLET_DECLINE_PROOF_REQUEST}${tenantId}`;
      const proofAcceptRequestPayload = {
        sendProblemReport,
        problemReportDescription
      };

      const declineProofRequest = await this.commonService.httpPost(url, proofAcceptRequestPayload, {
        headers: { authorization: decryptedApiKey }
      });
      return declineProofRequest;
    } catch (error) {
      await this.commonService.handleError(error);
      throw error;
    }
  }

  /**
   * Get proof presentation by proof Id
   * @param proofPrsentationByIdPayload
   * @returns proof presentation
   */
  async getProofById(proofPrsentationByIdPayload: IGetProofPresentationById): Promise<IProofRequestRes> {
    try {
      const { proofRecordId, userId } = proofPrsentationByIdPayload;
      const [getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);

      const { tenantId } = getTenant;
      const { agentEndpoint } = getTenant;

      const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_GET_PROOF_REQUEST}/${proofRecordId}/${tenantId}`;

      const getProofById = await this.commonService.httpGet(url, { headers: { authorization: decryptedApiKey } });
      return getProofById;
    } catch (error) {
      await this.commonService.handleError(error);
      throw error;
    }
  }

    /**
   * Get proof presentation by proof Id
   * @param proofPrsentationByIdPayload
   * @returns proof presentation
   */
    async submitProofWithCred(proofPresentationByIdPayload: IProofPresentationPayloadWithCred): Promise<IProofRequestRes> {
      try {
        const { proof, userId } = proofPresentationByIdPayload;
        const [getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
  
        const { tenantId } = getTenant;
        const { agentEndpoint } = getTenant;
  
        const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_POST_PROOF_REQUEST_WITH_CRED}/${tenantId}`;
  
        const submitProofWithCred = await this.commonService.httpPost(url, proof, { headers: { authorization: decryptedApiKey } });
        return submitProofWithCred;
      } catch (error) {
        await this.commonService.handleError(error);
        throw error;
      }
    }

    /**
   * Get Credentials by proof Id
   * @param proofPrsentationByIdPayload
   * @returns proof presentation
   */
    async getCredentialsByProofId(proofPrsentationByIdPayload: IGetCredentialsForRequest): Promise<ICredentialForRequestRes> {
      try {
        const { proofRecordId, userId } = proofPrsentationByIdPayload;
        const [getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
  
        const { tenantId } = getTenant;
        const { agentEndpoint } = getTenant;
  
        const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_GET_CREDENTIALS_BY_PROOF_REQUEST}/${tenantId}/${proofRecordId}`;
  
        const getProofById = await this.commonService.httpGet(url, { headers: { authorization: decryptedApiKey } });
        return getProofById;
      } catch (error) {
        if (error.response?.error?.message?.includes('Proof record is in invalid state')) {
          throw new RpcException({message:error.response.error.message, statusCode:  HttpStatus.BAD_REQUEST});
        }
        await this.commonService.handleError(error);
        
        throw error;
      }
    }

  /**
   * Get proof presentation
   * @param proofPresentationPayload
   * @returns proof presentations
   */
  async getProofPresentation(proofPresentationPayload: IGetProofPresentation): Promise<IProofRequestRes[]> {
    try {
      const { threadId, userId } = proofPresentationPayload;

      const [getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);

      const { tenantId } = getTenant;
      const { agentEndpoint } = getTenant;

      const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_GET_PROOF_REQUEST}/${tenantId}${
        threadId ? `?threadId=${threadId}` : ''
      }`;

      const getProofById = await this.commonService.httpGet(url, { headers: { authorization: decryptedApiKey } });
      return getProofById;
    } catch (error) {
      await this.commonService.handleError(error);
      throw error;
    }
  }

  /**
   * common function for get cloud wallet
   * @param userId
   * @returns cloud wallet info
   */
  async _commonCloudWalletInfo(userId: string): Promise<[CloudWallet, string]> {
  
    const getTenant = await this.cloudWalletRepository.getCloudSubWallet(userId);

    if (!getTenant) {
      throw new NotFoundException(ResponseMessages.cloudWallet.error.walletRecordNotFound);
    }

    const getAgentDetails = await this.commonService.httpGet(
      `${getTenant?.agentEndpoint}${CommonConstants.URL_AGENT_GET_ENDPOINT}`
    );
    if (!getAgentDetails?.isInitialized) {
      throw new BadRequestException(ResponseMessages.cloudWallet.error.notReachable);
    }
  
    if (!getTenant || !getTenant?.tenantId) {
      throw new NotFoundException(ResponseMessages.cloudWallet.error.walletRecordNotFound);
    }

    const decryptedApiKey = await this.commonService.decryptPassword(getTenant?.agentApiKey);

    return [getTenant, decryptedApiKey];
  }

  /**
   * Create clous wallet
   * @param cloudWalletDetails
   * @returns cloud wallet details
   */
  async createCloudWallet(cloudWalletDetails: ICreateCloudWallet): Promise<IStoredWalletDetails> {
    try {
      const { label, connectionImageUrl, email, userId } = cloudWalletDetails;
      const agentPayload = {
        config: {
          label,
          connectionImageUrl
        }
      };

      const checkUserExist = await this.cloudWalletRepository.checkUserExist(userId);

      if (checkUserExist) {
        throw new ConflictException(ResponseMessages.cloudWallet.error.userExist);
      }
  
      const baseWalletDetails = await this.cloudWalletRepository.getCloudWalletDetails(CloudWalletType.BASE_WALLET);

      if (!baseWalletDetails) {
      throw new InternalServerErrorException(ResponseMessages.cloudWallet.error.BaseWalletLimitExceeded, {
        cause: new Error(),
        description: ResponseMessages.errorMessages.serverError
      });
      } else {
        const lastSubWallet: boolean = baseWalletDetails.useCount >= baseWalletDetails.maxSubWallets - 1;
        await this.cloudWalletRepository.updateCloudWalletDetails({
          id: baseWalletDetails.id
        },
        {
          useCount : {
            increment: 1
          },
          ...(lastSubWallet && { isActive : false })
        }
      );
      }

      const { agentEndpoint, agentApiKey } = baseWalletDetails;
      const url = `${agentEndpoint}${CommonConstants.URL_SHAGENT_CREATE_TENANT}`;
      const decryptedApiKey = await this.commonService.decryptPassword(agentApiKey);

      const checkCloudWalletAgentHealth = await this.commonService.checkAgentHealth(agentEndpoint, decryptedApiKey);

      if (!checkCloudWalletAgentHealth) {
        throw new NotFoundException(ResponseMessages.cloudWallet.error.agentNotRunning);
      }
      const createCloudWalletResponse = await this.commonService.httpPost(url, agentPayload, {
        headers: { authorization: decryptedApiKey }
      });

      if (!createCloudWalletResponse && !createCloudWalletResponse.id) {
        throw new InternalServerErrorException(ResponseMessages.cloudWallet.error.createCloudWallet, {
          cause: new Error(),
          description: ResponseMessages.errorMessages.serverError
        });
      }

      const walletKey = await this.commonService.dataEncryption(createCloudWalletResponse.config.walletConfig.key);

      if (!walletKey) {
        throw new BadRequestException(ResponseMessages.cloudWallet.error.encryptCloudWalletKey, {
          cause: new Error(),
          description: ResponseMessages.errorMessages.serverError
        });
      }

      const cloudWalletResponse: ICloudWalletDetails = {
        createdBy: userId,
        label,
        lastChangedBy: userId,
        tenantId: createCloudWalletResponse.id,
        type: CloudWalletType.SUB_WALLET,
        userId,
        agentApiKey,
        agentEndpoint,
        email,
        key: walletKey,
        connectionImageUrl
      };
      const storeCloudWalletDetails = await this.cloudWalletRepository.storeCloudWalletDetails(cloudWalletResponse);
      return storeCloudWalletDetails;
    } catch (error) {
      this.logger.error(`[createCloudWallet] - error in create cloud wallet: ${error}`);
      await this.commonService.handleError(error);
    }
  }

    /**
   * Create clous wallet
   * @param cloudWalletDetails
   * @returns cloud wallet details
   */
  async deleteCloudWallet(cloudWalletDetails: IDeleteCloudWallet): Promise<cloud_wallet_user_info> {
    try {
      const { userId } = cloudWalletDetails;

      const [getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
  
      const { tenantId } = getTenant;
      const { agentEndpoint } = getTenant;
  
      const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_DELETE_BY_TENANT_ID}${tenantId}`;
  
      await this.commonService.httpDelete(url, { headers: { authorization: decryptedApiKey } });

      const res = await this.cloudWalletRepository.deleteCloudSubWallet(userId);
  
      return res;
    } catch (error) {
      this.logger.error(`[createCloudWallet] - error in create cloud wallet: ${error}`);
      await this.commonService.handleError(error);
    }
  }


    /**
   * Create clous wallet
   * @param cloudWalletDetails
   * @returns cloud wallet details
   */
    async getBaseWalletDetails(user:user): Promise<BaseAgentInfo[]> {
      try {
        const baseWalletDetails = await this.cloudWalletRepository.getBaseWalletDetails(CloudWalletType.BASE_WALLET, user);
        return baseWalletDetails;
      } catch (error) {
        this.logger.error(`[createCloudWallet] - error in create cloud wallet: ${error}`);
        await this.commonService.handleError(error);
      }
    }

    async updateBaseWalletDetails(updateBaseWalletDto:UpdateBaseWalletDto): Promise<BaseAgentInfo> {
      try {
        const baseWalletDetails = await this.cloudWalletRepository.updateBaseWalletDetails(CloudWalletType.BASE_WALLET, updateBaseWalletDto);
        return baseWalletDetails;
      } catch (error) {
        this.logger.error(`[createCloudWallet] - error in create cloud wallet: ${error}`);
        await this.commonService.handleError(error);
      }
    }

  /**
   * Receive invitation
   * @param ReceiveInvitationDetails
   * @returns Invitation details
   */
  async receiveInvitationByUrl(ReceiveInvitationDetails: IReceiveInvitation): Promise<Response> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { email, userId, ...invitationDetails } = ReceiveInvitationDetails;

      const checkUserExist = await this.cloudWalletRepository.checkUserExist(userId);

      if (!checkUserExist) {
        throw new ConflictException(ResponseMessages.cloudWallet.error.walletNotExist);
      }

      const [getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);

      const { tenantId } = getTenant;
      const { agentEndpoint } = getTenant;
      const url = `${agentEndpoint}${CommonConstants.RECEIVE_INVITATION_BY_URL}${tenantId}`;

      const checkCloudWalletAgentHealth = await this.commonService.checkAgentHealth(agentEndpoint, decryptedApiKey);

      if (!checkCloudWalletAgentHealth) {
        throw new NotFoundException(ResponseMessages.cloudWallet.error.agentNotRunning);
      }
      const receiveInvitationResponse = await this.commonService.httpPost(url, invitationDetails, {
        headers: { authorization: decryptedApiKey }
      });

      if (!receiveInvitationResponse) {
        throw new InternalServerErrorException(ResponseMessages.cloudWallet.error.receiveInvitation, {
          cause: new Error(),
          description: ResponseMessages.errorMessages.serverError
        });
      }

      return receiveInvitationResponse;
    } catch (error) {
      this.logger.error(`[createCloudWallet] - error in receive invitation: ${error}`);
      await this.commonService.handleError(error);
    }
  }

  /**
   * Accept offer
   * @param acceptOfferDetails
   * @returns Offer details
   */
  async acceptOffer(acceptOfferDetails: IAcceptOffer): Promise<Response> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { email, userId, ...offerDetails } = acceptOfferDetails;

      const checkUserExist = await this.cloudWalletRepository.checkUserExist(userId);

      if (!checkUserExist) {
        throw new ConflictException(ResponseMessages.cloudWallet.error.walletNotExist);
      }
      const [getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);

      const { tenantId } = getTenant;
      const { agentEndpoint } = getTenant;

      const url = `${agentEndpoint}${CommonConstants.ACCEPT_OFFER}${tenantId}`;

      const checkCloudWalletAgentHealth = await this.commonService.checkAgentHealth(agentEndpoint, decryptedApiKey);

      if (!checkCloudWalletAgentHealth) {
        throw new NotFoundException(ResponseMessages.cloudWallet.error.agentNotRunning);
      }
      const acceptOfferResponse = await this.commonService.httpPost(url, offerDetails, {
        headers: { authorization: decryptedApiKey }
      });

      if (!acceptOfferResponse) {
        throw new InternalServerErrorException(ResponseMessages.cloudWallet.error.receiveInvitation, {
          cause: new Error(),
          description: ResponseMessages.errorMessages.serverError
        });
      }

      return acceptOfferResponse;
    } catch (error) {
      this.logger.error(`[receiveInvitationByUrl] - error in accept offer: ${error}`);
      await this.commonService.handleError(error);
    }
  }

  /**
   * Create DID for cloud wallet
   * @param createDidDetails
   * @returns DID details
   */
  async createDid(createDidDetails: ICreateCloudWalletDid): Promise<Response> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { email, userId, ...didDetails } = createDidDetails;

      const checkUserExist = await this.cloudWalletRepository.checkUserExist(userId);

      if (!checkUserExist) {
        throw new ConflictException(ResponseMessages.cloudWallet.error.walletNotExist);
      }
      const [getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);

      const { tenantId } = getTenant;
      const { agentEndpoint } = getTenant;

      const url = `${agentEndpoint}${CommonConstants.URL_SHAGENT_CREATE_DID}${tenantId}`;

      const checkCloudWalletAgentHealth = await this.commonService.checkAgentHealth(agentEndpoint, decryptedApiKey);

      if (!checkCloudWalletAgentHealth) {
        throw new NotFoundException(ResponseMessages.cloudWallet.error.agentNotRunning);
      }
      const didDetailsResponse = await this.commonService.httpPost(url, didDetails, {
        headers: { authorization: decryptedApiKey }
      });

      if (!didDetailsResponse) {
        throw new InternalServerErrorException(ResponseMessages.cloudWallet.error.receiveInvitation, {
          cause: new Error(),
          description: ResponseMessages.errorMessages.serverError
        });
      }

      return didDetailsResponse;
    } catch (error) {
      this.logger.error(`[createDid] - error in create DID: ${error}`);
      await this.commonService.handleError(error);
    }
  }

    /**
   * Create DID for cloud wallet
   * @param exportWallet
   * @returns DID details
   */
  async exportCloudWallet(exportWallet: IExportCloudWallet): Promise<Response> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { email, userId, passKey, walletID } = exportWallet;

      const checkUserExist = await this.cloudWalletRepository.checkUserExist(userId);

      if (!checkUserExist) {
        throw new ConflictException(ResponseMessages.cloudWallet.error.walletNotExist);
      }
      const [getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);

      const { tenantId } = getTenant;
      const { agentEndpoint } = getTenant;
      // Change here 
      const url = `${agentEndpoint}${CommonConstants.URL_CLOUD_WALLET_EXPORT}${tenantId}`;

      const checkCloudWalletAgentHealth = await this.commonService.checkAgentHealth(agentEndpoint, decryptedApiKey);

      if (!checkCloudWalletAgentHealth) {
        throw new NotFoundException(ResponseMessages.cloudWallet.error.agentNotRunning);
      }
      const exportWalletResponse = await this.commonService.httpPost(url, {passKey, walletID}, {
        headers: { authorization: decryptedApiKey }
      });

      if (!exportWalletResponse) {
        throw new InternalServerErrorException(ResponseMessages.cloudWallet.error.exportWallet, {
          cause: new Error(),
          description: ResponseMessages.errorMessages.serverError
        });
      }

      return exportWalletResponse;
    } catch (error) {
      this.logger.error(`[export wallet] - error while exporting wallet: ${error}`);
      await this.commonService.handleError(error);
    }
  }

  /**
   * Get DID list by tenant id
   * @param walletDetails
   * @returns DID list
   */
  async getDidList(walletDetails: IWalletDetailsForDidList): Promise<Response> {
    try {
      const { userId } = walletDetails;
      const [getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);

      const { tenantId } = getTenant;
      const { agentEndpoint } = getTenant;
      const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_DID_LIST}${tenantId}?isDefault=${walletDetails.isDefault}`;

      const didList = await this.commonService.httpGet(url, { headers: { authorization: decryptedApiKey } });
      didList['hashTenantID'] = md5(tenantId);
      return didList;
    } catch (error) {
      await this.commonService.handleError(error);
      throw error;
    }
  }

  /**
   * Get connection details by tenant id and connection id
   * @param connectionDetails
   * @returns Connection Details
   */
  async getconnectionById(connectionDetails: IConnectionDetailsById): Promise<Response> {
    try {
      const { userId, connectionId } = connectionDetails;
      const [getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);

      const { tenantId } = getTenant;
      const { agentEndpoint } = getTenant;

      const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_CONNECTION_BY_ID}${connectionId}/${tenantId}`;

      const connectionDetailResponse = await this.commonService.httpGet(url, { headers: { authorization: decryptedApiKey } });
      return connectionDetailResponse;
    } catch (error) {
      await this.commonService.handleError(error);
      throw error;
    }
  }


    /**
   * Add connection Type 
   * @param connectionDetails
   * @returns Connection Details
   */
  async AddConnectionTypeById(connectionDetails: IAddConnectionType): Promise<Response> {
    try {
      const { userId, connectionId,  connectionType} = connectionDetails;
      const [getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);

      const { tenantId } = getTenant;
      const { agentEndpoint } = getTenant;

      const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_ADD_CONNECTION_TYPE}${connectionId}/${tenantId}`;

      const connectionDetailResponse = await this.commonService.httpPost(url, {connectionType}, {
        headers: { authorization: decryptedApiKey }
      });
      return connectionDetailResponse;
    } catch (error) {
      await this.commonService.handleError(error);
      throw error;
    }
  }

    /**
   * Get connection list by tenant id
   * @param connectionDetails
   * @returns Connection Details
   */
    async getAllconnectionById(connectionDetails: GetAllCloudWalletConnections): Promise<Response> {
      try {
        const { userId, alias, myDid, outOfBandId, theirDid, theirLabel } = connectionDetails;
        const [getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
        const urlOptions = {
          alias,
          myDid,
          outOfBandId,
          theirDid,
          theirLabel
        };
        const optionalParameter = await this.commonService.createDynamicUrl(urlOptions);
        const { tenantId } = getTenant;
        const { agentEndpoint } = getTenant;
  
        const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_CONNECTION_BY_ID}${tenantId}${optionalParameter}`;
  
        const connectionDetailList = await this.commonService.httpGet(url, { headers: { authorization: decryptedApiKey } });
        return connectionDetailList;
      } catch (error) {
        await this.commonService.handleError(error);
        throw error;
      }
    }

  /**
   * Get credential list by tenant id
   * @param tenantDetails
   * @returns Connection Details
   */
  async getCredentialListById(tenantDetails: ITenantDetail): Promise<Response> {
    try {
      const { userId, connectionId, state, threadId } = tenantDetails;
      const [getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
      const urlOptions = {
        connectionId,
        state,
        threadId
      };
      const {tenantId} = getTenant;
     const optionalParameter = await this.commonService.createDynamicUrl(urlOptions);
  
      const { agentEndpoint } = getTenant;

      const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_CREDENTIAL}/${tenantId}${optionalParameter}`;

      const credentialDetailResponse = await this.commonService.httpGet(url, { headers: { authorization: decryptedApiKey } });
      return credentialDetailResponse;
    } catch (error) {
      await this.commonService.handleError(error);
      throw error;
    }
  }

  /**
   * Get credential by record id
   * @param credentialDetails
   * @returns credential Details
   */
  async getCredentialByRecord(credentialDetails: ICredentialDetails): Promise<Response> {
    try {
      const { userId, credentialRecordId } = credentialDetails;
      const [getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
     
      const {tenantId} = getTenant;
      const { agentEndpoint } = getTenant;

      const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_CREDENTIAL}/${credentialRecordId}/${tenantId}`;

      const credentialDetailResponse = await this.commonService.httpGet(url, { headers: { authorization: decryptedApiKey } });
      return credentialDetailResponse;
    } catch (error) {
      await this.commonService.handleError(error);
      throw error;
    }
  }

    /**
   * Get credential by record id
   * @param credentialDetails
   * @returns credential Details
   */
    async getCredentialFormatDataByRecord(credentialDetails: ICredentialDetails): Promise<Response> {
      try {
        const { userId, credentialRecordId } = credentialDetails;
        const [getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
       
        const {tenantId} = getTenant;
        const { agentEndpoint } = getTenant;
  
        const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_CREDENTIAL_FORMAT_DATA}/${credentialRecordId}/${tenantId}`;
  
        const credentialDetailResponse = await this.commonService.httpGet(url, { headers: { authorization: decryptedApiKey } });
        return credentialDetailResponse;
      } catch (error) {
        await this.commonService.handleError(error);
        throw error;
      }
    }

       /**
   * Get credential by record id
   * @param proofDetails
   * @returns credential Details
   */
       async getProofFormDataByRecord(proofDetails: IProofPresentationDetails): Promise<Response> {
        try {
          const { userId, proofRecordId } = proofDetails;
          const [getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
         
          const {tenantId} = getTenant;
          const { agentEndpoint } = getTenant;
    
          const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_PROOF_FORM_DATA}/${tenantId}/${proofRecordId}`;
    
          const credentialDetailResponse = await this.commonService.httpGet(url, { headers: { authorization: decryptedApiKey } });
          return credentialDetailResponse;
        } catch (error) {
          await this.commonService.handleError(error);
          throw error;
        }
      }


        /**
   * Get credential by record id
   * @param credentialDetails
   * @returns credential Details
   */
        async deleteCredentialByRecord(credentialDetails: ICredentialDetails): Promise<Response> {
          try {
            const { userId, credentialRecordId } = credentialDetails;
            const [getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
           
            const {tenantId} = getTenant;
            const { agentEndpoint } = getTenant;
      
            const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_DELETE_CREDENTIAL}/${credentialRecordId}/${tenantId}`;
      
            const credentialDetailResponse = await this.commonService.httpDelete(url, { headers: { authorization: decryptedApiKey } });
            return credentialDetailResponse;
          } catch (error) {
            await this.commonService.handleError(error);
            throw error;
          }
        }


    /**
    * Delete W3C credential by record id
    * @param credentialDetails
    */
    async deleteW3cCredentialByRecord(credentialDetails: ICredentialDetails): Promise<Response> {
      try {
        const { userId, credentialRecordId } = credentialDetails;
        const [getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
           
        const {tenantId} = getTenant;
        const { agentEndpoint } = getTenant;
  
        const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_DELETE_W3C_CREDENTIAL}/${credentialRecordId}/${tenantId}`;
  
        const credentialDetailResponse = await this.commonService.httpDelete(url, { headers: { authorization: decryptedApiKey } });
        return credentialDetailResponse;
      } catch (error) {
        await this.commonService.handleError(error);
        throw error;
      }
    }
    
  /**
   * Get basic-message by connection id
   * @param connectionDetails
   * @returns Basic message Details
   */
  async getBasicMessageByConnectionId(connectionDetails: IBasicMessage): Promise<Response> {
    try {
      const { userId, connectionId } = connectionDetails;
      const [getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
     
      const {tenantId} = getTenant;
      const { agentEndpoint } = getTenant;

      const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_BASIC_MESSAGE}${connectionId}/${tenantId}`;

      const basicMessageResponse = await this.commonService.httpGet(url, { headers: { authorization: decryptedApiKey } });
      return basicMessageResponse;
    } catch (error) {
      await this.commonService.handleError(error);
      throw error;
    }
  }

   /**
   * Send basic-message by connection id
   * @param messageDetails
   * @returns Basic message Details
   */
   async sendBasicMessage(messageDetails: IBasicMessageDetails): Promise<Response> {
    try {
      const { userId, connectionId, content } = messageDetails;
      const [getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
     
      const {tenantId} = getTenant;
      const { agentEndpoint } = getTenant;

      const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_BASIC_MESSAGE}${connectionId}/${tenantId}`;
      const basicMessageResponse = await this.commonService.httpPost(url, {content}, {
        headers: { authorization: decryptedApiKey }
      });
      return basicMessageResponse;
    } catch (error) {
      await this.commonService.handleError(error);
      throw error;
    }
  }

     /**
   * Create self-attested W3C credential
   * @param selfAttestedCredential
   * @returns Self-attested credential Details
   */
  async createSelfAttestedW3cCredential(selfAttestedCredential: ISelfAttestedCredential): Promise<Response> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { email, userId, ...selfAttestedDetails } = selfAttestedCredential;

      const [getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
           
      const {tenantId} = getTenant;
      const { agentEndpoint } = getTenant;

      const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_SELF_ATTESTED_W3C_CREDENTIAL}${tenantId}`;

      const checkCloudWalletAgentHealth = await this.commonService.checkAgentHealth(agentEndpoint, decryptedApiKey);

      if (!checkCloudWalletAgentHealth) {
        throw new NotFoundException(ResponseMessages.cloudWallet.error.agentNotRunning);
      }
      const selfAttestedCredentialResponse = await this.commonService.httpPost(url, selfAttestedDetails, {
        headers: { authorization: decryptedApiKey }
      });

      if (!selfAttestedCredentialResponse) {
        throw new InternalServerErrorException(ResponseMessages.cloudWallet.error.createSelfAttestedW3cCredential, {
          cause: new Error(),
          description: ResponseMessages.errorMessages.serverError
        });
      }

      selfAttestedCredentialResponse.tenantId = tenantId;

      return selfAttestedCredentialResponse;
    } catch (error) {
      this.logger.error(`[createSelfAttestedW3cCredential] - error in create self-attested credential: ${error}`);
      await this.commonService.handleError(error);
    }
  }

  /**
   * Get all W3C credential by tenant id
   * @param w3cCredential
   * @returns W3C Credential list
   */
  async getAllW3cCredentials(w3cCredential: IW3cCredentials): Promise<Response> {
    try {
      const { userId } = w3cCredential;
      const [getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
           
      const {tenantId} = getTenant;
      const { agentEndpoint } = getTenant;

      const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_W3C_CREDENTIAL}${tenantId}`;

      const credentialDetailResponse = await this.commonService.httpGet(url, { headers: { authorization: decryptedApiKey } });
      return credentialDetailResponse;
    } catch (error) {
      await this.commonService.handleError(error);
      throw error;
    }
  }

  /**
   * Get W3C credential by record id
   * @param w3cCredential
   * @returns W3C credential Details
   */
  async getW3cCredentialByRecordId(w3cCredential: IW3cCredentials): Promise<Response> {
    try {
      const { userId, credentialRecordId } = w3cCredential;
      const [getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
           
      const {tenantId} = getTenant;
      const { agentEndpoint } = getTenant;

      const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_W3C_CREDENTIAL}${tenantId}/${credentialRecordId}`;

      const credentialDetailResponse = await this.commonService.httpGet(url, { headers: { authorization: decryptedApiKey } });
      return credentialDetailResponse;
    } catch (error) {
      await this.commonService.handleError(error);
      throw error;
    }
  }
}
