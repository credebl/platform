/* eslint-disable camelcase */
import { CommonService } from '@credebl/common';
import { BadRequestException, ConflictException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { IAcceptProofRequest, IProofRequestRes, ICloudBaseWalletConfigure, ICloudWalletDetails, ICreateCloudWallet, IGetProofPresentation, IGetProofPresentationById, IGetStoredWalletInfo, IStoredWalletDetails, CloudWallet, IStoreWalletInfo, ICreateConnection, IConnectionInvitationResponse } from '@credebl/common/interfaces/cloud-wallet.interface';
import { CloudWalletRepository } from './cloud-wallet.repository';
import { ResponseMessages } from '@credebl/common/response-messages';
import { CloudWalletType } from '@credebl/enum/enum';
import { CommonConstants } from '@credebl/common/common.constant';

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
    const { agentEndpoint, apiKey, email, walletKey, userId } = configureBaseWalletPayload;

    try {
        const getAgentInfo = await this.commonService.httpGet(`${agentEndpoint}${CommonConstants.URL_AGENT_GET_ENDPOINT}`);
        if (!getAgentInfo?.isInitialized) {
            throw new BadRequestException(ResponseMessages.cloudWallet.error.notReachable);
        }

        const existingWalletInfo = await this.cloudWalletRepository.getCloudWalletInfo(email);
        if (existingWalletInfo) {
            throw new ConflictException(ResponseMessages.cloudWallet.error.agentAlreadyExist);
        }

        const [encryptionWalletKey, encryptionApiKey] = await Promise.all([
            this.commonService.dataEncryption(walletKey),
            this.commonService.dataEncryption(apiKey)
        ]);

        const walletInfoToStore: IStoreWalletInfo = {
            agentEndpoint,
            agentApiKey: encryptionApiKey,
            email,
            type: CloudWalletType.BASE_WALLET,
            userId,
            key: encryptionWalletKey,
            createdBy: userId,
            lastChangedBy: userId
        };

        const storedWalletInfo = await this.cloudWalletRepository.storeCloudWalletInfo(walletInfoToStore);
        return storedWalletInfo;
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
        const [baseWalletDetails, getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);

        const { tenantId } = getTenant;
        const { agentEndpoint } = baseWalletDetails;

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
    const { proofRecordId, comment, filterByNonRevocationRequirements, filterByPresentationPreview, userId } = acceptProofRequest;
    try {

        const [baseWalletDetails, getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);

        const { tenantId } = getTenant;
        const { agentEndpoint } = baseWalletDetails;

        const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_GET_PROOF_REQUEST}/${proofRecordId}${CommonConstants.CLOUD_WALLET_ACCEPT_PROOF_REQUEST}${tenantId}`;
        const proofAcceptRequestPayload = {
          comment, 
          filterByNonRevocationRequirements, 
          filterByPresentationPreview
        };


        const acceptProofRequest = await this.commonService.httpPost(url, proofAcceptRequestPayload, { headers: { authorization: decryptedApiKey } });       
        return acceptProofRequest;
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
        const [baseWalletDetails, getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);

        const { tenantId } = getTenant;
        const { agentEndpoint } = baseWalletDetails;

        const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_GET_PROOF_REQUEST}/${proofRecordId}/${tenantId}`;

        const getProofById = await this.commonService.httpGet(url, { headers: { authorization: decryptedApiKey } });       
        return getProofById;
    } catch (error) {
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

        const [baseWalletDetails, getTenant, decryptedApiKey] = await this._commonCloudWalletInfo(userId);

        const { tenantId } = getTenant;
        const { agentEndpoint } = baseWalletDetails;

        const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_GET_PROOF_REQUEST}/${tenantId}${threadId ? `?threadId=${threadId}` : ''}`;

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
  async _commonCloudWalletInfo(userId: string): Promise<[CloudWallet, CloudWallet, unknown]> {
      const baseWalletDetails = await this.cloudWalletRepository.getCloudWalletDetails(CloudWalletType.BASE_WALLET);

      if (!baseWalletDetails) {
        throw new NotFoundException(ResponseMessages.cloudWallet.error.notFoundBaseWallet);
      }

      const getAgentDetails = await this.commonService.httpGet(`${baseWalletDetails?.agentEndpoint}${CommonConstants.URL_AGENT_GET_ENDPOINT}`);
      if (!getAgentDetails?.isInitialized) {
          throw new BadRequestException(ResponseMessages.cloudWallet.error.notReachable);
      }

      const getTenant = await this.cloudWalletRepository.getCloudSubWallet(userId);

      if (!getTenant) {
        throw new NotFoundException(ResponseMessages.cloudWallet.error.walletRecordNotFound);
      }

      const decryptedApiKey = await this.commonService.decryptPassword(getTenant?.agentApiKey);

      return [baseWalletDetails, getTenant, decryptedApiKey];
  }

  /**
   * Create clous wallet
   * @param cloudWalletDetails
   * @returns cloud wallet details
   */
  async createCloudWallet(cloudWalletDetails: ICreateCloudWallet): Promise<IStoredWalletDetails> {
    try {
      // TODO - Add userId fetch logic
      const {label, connectionImageUrl, email, userId} = cloudWalletDetails;
      const agentPayload = {
        config: {
          label,
          connectionImageUrl
        }
      };
     const baseWalletDetails = await this.cloudWalletRepository.getCloudWalletDetails(CloudWalletType.BASE_WALLET);
     if (!baseWalletDetails) {
      throw new NotFoundException(ResponseMessages.cloudWallet.error.baseWalletNotFound);
     }
     const {agentEndpoint, agentApiKey} = baseWalletDetails;
     const decryptedApiKey = await this.commonService.decryptPassword(agentApiKey);
      const url = `${agentEndpoint}${CommonConstants.URL_SHAGENT_CREATE_TENANT}`;
      const createCloudWalletResponse = await this.commonService.httpPost(url, agentPayload, { headers: { authorization: decryptedApiKey } });
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
}
