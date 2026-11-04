/* eslint-disable camelcase */
import { CommonService } from '@credebl/common';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common';
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
  IResolveCredentialOffer,
  IAuthorizeRequestCredential,
  IRequestCredential,
  IResolveProofRequest,
  IAcceptOid4vpProofRequest,
  IDecodeMdoc,
  IDecodeSdJwt,
  IDeleteHolderCredential
} from '@credebl/common/interfaces/cloud-wallet.interface';
import { CloudWalletRepository } from './cloud-wallet.repository';
import { ResponseMessages } from '@credebl/common/response-messages';
import { CloudWalletType } from '@credebl/enum/enum';
import { CommonConstants } from '@credebl/common/common.constant';

@Injectable()
export class CloudWalletService {
  constructor(
    private readonly commonService: CommonService,
    private readonly cloudWalletRepository: CloudWalletRepository,
    private readonly logger: Logger
  ) {}

  /**
   * configure cloud base wallet
   * @param configureBaseWalletPayload
   * @returns cloud base wallet
   */
  async configureBaseWallet(configureBaseWalletPayload: ICloudBaseWalletConfigure): Promise<IGetStoredWalletInfo> {
    const { agentEndpoint, apiKey, email, walletKey, userId } = configureBaseWalletPayload;

    try {
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
      const [baseWalletDetails, decryptedApiKey] = await this._commonCloudWalletInfo(userId);

      delete connectionPayload.email;
      const { agentEndpoint } = baseWalletDetails;

      const url = `${agentEndpoint}${CommonConstants.URL_CONN_INVITE}`;

      const createConnectionDetails = await this.commonService.httpPost(url, connectionPayload, {
        headers: { authorization: decryptedApiKey }
      });
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
      const [baseWalletDetails, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
      const { agentEndpoint } = baseWalletDetails;

      const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_GET_PROOF_REQUEST}/${proofRecordId}${CommonConstants.CLOUD_WALLET_ACCEPT_PROOF_REQUEST}`;
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
   * Get proof presentation by proof Id
   * @param proofPrsentationByIdPayload
   * @returns proof presentation
   */
  async getProofById(proofPrsentationByIdPayload: IGetProofPresentationById): Promise<IProofRequestRes> {
    try {
      const { proofRecordId, userId } = proofPrsentationByIdPayload;
      const [baseWalletDetails, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
      const { agentEndpoint } = baseWalletDetails;
      const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_GET_PROOF_REQUEST}/${proofRecordId}}`;

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

      const [baseWalletDetails, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
      const { agentEndpoint } = baseWalletDetails;
      const threadParam = threadId ? `?threadId=${threadId}` : '';
      const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_GET_PROOF_REQUEST}/${threadParam}}`;
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
    const baseWalletDetails = await this.cloudWalletRepository.getCloudWalletDetails(CloudWalletType.BASE_WALLET);

    if (!baseWalletDetails) {
      throw new NotFoundException(ResponseMessages.cloudWallet.error.notFoundBaseWallet);
    }

    const getAgentDetails = await this.commonService.httpGet(
      `${baseWalletDetails?.agentEndpoint}${CommonConstants.URL_AGENT_GET_ENDPOINT}`
    );
    if (!getAgentDetails?.isInitialized) {
      throw new BadRequestException(ResponseMessages.cloudWallet.error.notReachable);
    }

    const getTenant = await this.cloudWalletRepository.getCloudSubWallet(userId);

    if (!getTenant || !getTenant?.tenantId) {
      throw new NotFoundException(ResponseMessages.cloudWallet.error.walletRecordNotFound);
    }

    const decryptedApiKey = await this.commonService.decryptPassword(getTenant?.agentApiKey);

    return [baseWalletDetails, decryptedApiKey];
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

      const checkUserExist = await this.cloudWalletRepository.checkUserExist(email);

      if (checkUserExist) {
        throw new ConflictException(ResponseMessages.cloudWallet.error.userExist);
      }

      const baseWalletDetails = await this.cloudWalletRepository.getCloudWalletDetails(CloudWalletType.BASE_WALLET);

      const { agentEndpoint, agentApiKey } = baseWalletDetails;
      if (!agentEndpoint || !agentApiKey) {
        throw new NotFoundException(ResponseMessages.cloudWallet.error.notFoundBaseWallet);
      }
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

      const walletKey = await this.commonService.dataEncryption(createCloudWalletResponse.config.walletConfig.token);

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
        agentApiKey: this.commonService.dataEncryption(createCloudWalletResponse.token),
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
   * Receive invitation
   * @param ReceiveInvitationDetails
   * @returns Invitation details
   */
  async receiveInvitationByUrl(ReceiveInvitationDetails: IReceiveInvitation): Promise<Response> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { email, userId, ...invitationDetails } = ReceiveInvitationDetails;

      const checkUserExist = await this.cloudWalletRepository.checkUserExist(email);

      if (!checkUserExist) {
        throw new ConflictException(ResponseMessages.cloudWallet.error.walletNotExist);
      }
      const [baseWalletDetails, decryptedApiKey] = await this._commonCloudWalletInfo(userId);

      const { agentEndpoint } = baseWalletDetails;
      const url = `${agentEndpoint}${CommonConstants.RECEIVE_INVITATION_BY_URL}`;

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

      const checkUserExist = await this.cloudWalletRepository.checkUserExist(email);

      if (!checkUserExist) {
        throw new ConflictException(ResponseMessages.cloudWallet.error.walletNotExist);
      }
      const [baseWalletDetails, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
      const { agentEndpoint } = baseWalletDetails;

      const url = `${agentEndpoint}${CommonConstants.ACCEPT_OFFER}`;

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

      const checkUserExist = await this.cloudWalletRepository.checkUserExist(email);

      if (!checkUserExist) {
        throw new ConflictException(ResponseMessages.cloudWallet.error.walletNotExist);
      }
      const [baseWalletDetails, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
      const { agentEndpoint } = baseWalletDetails;

      const url = `${agentEndpoint}${CommonConstants.URL_AGENT_WRITE_DID}`;

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
   * Get DID list by tenant id
   * @param walletDetails
   * @returns DID list
   */
  async getDidList(walletDetails: IWalletDetailsForDidList): Promise<IProofRequestRes[]> {
    try {
      const { userId } = walletDetails;
      const [baseWalletDetails, decryptedApiKey] = await this._commonCloudWalletInfo(userId);

      const { agentEndpoint } = baseWalletDetails;

      const url = `${agentEndpoint}${CommonConstants.URL_AGENT_GET_DID}`;

      const didList = (await this.commonService.httpGet(url, { headers: { authorization: decryptedApiKey } })) ?? [];
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
      const [baseWalletDetails, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
      const { agentEndpoint } = baseWalletDetails;

      const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_CONNECTION_BY_ID}/${connectionId}`;

      const connectionDetailResponse = await this.commonService.httpGet(url, {
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
      const [baseWalletDetails, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
      const urlOptions = {
        alias,
        myDid,
        outOfBandId,
        theirDid,
        theirLabel
      };
      const optionalParameter = await this.commonService.createDynamicUrl(urlOptions);
      const { agentEndpoint } = baseWalletDetails;

      const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_CONNECTION_BY_ID}${optionalParameter}`;

      const connectionDetailList = await this.commonService.httpGet(url, {
        headers: { authorization: decryptedApiKey }
      });
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
      const [baseWalletDetails, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
      const urlOptions = {
        connectionId,
        state,
        threadId
      };
      const optionalParameter = await this.commonService.createDynamicUrl(urlOptions);

      const { agentEndpoint } = baseWalletDetails;

      const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_CREDENTIAL}${optionalParameter}`;

      const credentialDetailResponse = await this.commonService.httpGet(url, {
        headers: { authorization: decryptedApiKey }
      });
      return credentialDetailResponse;
    } catch (error) {
      await this.commonService.handleError(error);
      throw error;
    }
  }

  /**
   * Get credential by record id
   * @param credentialDetails
   * @returns Connection Details
   */
  async getCredentialByRecord(credentialDetails: ICredentialDetails): Promise<Response> {
    try {
      const { userId, credentialRecordId } = credentialDetails;
      const [baseWalletDetails, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
      const { agentEndpoint } = baseWalletDetails;
      const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_CREDENTIAL}/${credentialRecordId}`;

      const credentialDetailResponse = await this.commonService.httpGet(url, {
        headers: { authorization: decryptedApiKey }
      });
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
      const [baseWalletDetails, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
      const { agentEndpoint } = baseWalletDetails;

      const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_BASIC_MESSAGE}${connectionId}`;

      const basicMessageResponse = await this.commonService.httpGet(url, {
        headers: { authorization: decryptedApiKey }
      });
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
      const [baseWalletDetails, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
      const { agentEndpoint } = baseWalletDetails;

      const url = `${agentEndpoint}${CommonConstants.CLOUD_WALLET_BASIC_MESSAGE}${connectionId}`;
      const basicMessageResponse = await this.commonService.httpPost(
        url,
        { content },
        {
          headers: { authorization: decryptedApiKey }
        }
      );
      return basicMessageResponse;
    } catch (error) {
      await this.commonService.handleError(error);
      throw error;
    }
  }

  /**
   * Get SD-JWT credentials from wallet
   * @param holderDetails
   * @returns SD-JWT credential list
   */
  async getSdJwtCredentials(holderDetails: IWalletDetailsForDidList): Promise<Response> {
    try {
      const { userId } = holderDetails;
      const [baseWalletDetails, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
      const { agentEndpoint } = baseWalletDetails;

      const url = `${agentEndpoint}${CommonConstants.OID4VC_HOLDER_SDJWT_VCS}`;
      return await this.commonService.httpGet(url, this._holderRequestConfig(decryptedApiKey));
    } catch (error) {
      await this.commonService.handleError(error);
      throw error;
    }
  }

  /**
   * Get mDoc credentials from wallet
   * @param holderDetails
   * @returns mDoc credential list
   */
  async getMdocCredentials(holderDetails: IWalletDetailsForDidList): Promise<Response> {
    try {
      const { userId } = holderDetails;
      const [baseWalletDetails, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
      const { agentEndpoint } = baseWalletDetails;

      const url = `${agentEndpoint}${CommonConstants.OID4VC_HOLDER_MDOC_VCS}`;
      return await this.commonService.httpGet(url, this._holderRequestConfig(decryptedApiKey));
    } catch (error) {
      await this.commonService.handleError(error);
      throw error;
    }
  }

  /**
   * Get W3C credentials from wallet
   * @param holderDetails
   * @returns W3C credential list
   */
  async getW3cCredentials(holderDetails: IWalletDetailsForDidList): Promise<Response> {
    try {
      const { userId } = holderDetails;
      const [baseWalletDetails, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
      const { agentEndpoint } = baseWalletDetails;

      const url = `${agentEndpoint}${CommonConstants.OID4VC_HOLDER_W3C_VCS}`;
      return await this.commonService.httpGet(url, this._holderRequestConfig(decryptedApiKey));
    } catch (error) {
      await this.commonService.handleError(error);
      throw error;
    }
  }

  /**
   * Decode mDoc credential
   * @param decodeMdocDetails
   * @returns decoded mDoc credential
   */
  async decodeMdoc(decodeMdocDetails: IDecodeMdoc): Promise<Response> {
    try {
      const { userId, ...payload } = decodeMdocDetails;
      delete payload.email;
      const [baseWalletDetails, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
      const { agentEndpoint } = baseWalletDetails;

      const url = `${agentEndpoint}${CommonConstants.OID4VC_HOLDER_MDOC_DECODE}`;
      return await this.commonService.httpPost(url, payload, this._holderRequestConfig(decryptedApiKey));
    } catch (error) {
      await this.commonService.handleError(error);
      throw error;
    }
  }

  /**
   * Decode SD-JWT credential
   * @param decodeSdJwtDetails
   * @returns decoded SD-JWT credential
   */
  async decodeSdJwt(decodeSdJwtDetails: IDecodeSdJwt): Promise<Response> {
    try {
      const { userId, ...payload } = decodeSdJwtDetails;
      delete payload.email;
      const [baseWalletDetails, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
      const { agentEndpoint } = baseWalletDetails;

      const url = `${agentEndpoint}${CommonConstants.OID4VC_HOLDER_DECODE_SDJWT}`;
      return await this.commonService.httpPost(url, payload, this._holderRequestConfig(decryptedApiKey));
    } catch (error) {
      await this.commonService.handleError(error);
      throw error;
    }
  }

  /**
   * Delete holder credential
   * @param deleteCredentialDetails
   * @returns deletion response
   */
  async deleteHolderCredential(deleteCredentialDetails: IDeleteHolderCredential): Promise<Response> {
    try {
      const { userId, ...payload } = deleteCredentialDetails;
      delete payload.email;
      const [baseWalletDetails, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
      const { agentEndpoint } = baseWalletDetails;

      const url = `${agentEndpoint}${CommonConstants.OID4VC_HOLDER_DELETE_CREDENTIAL}`;
      const config = this._holderRequestConfig(decryptedApiKey);
      const deleteResponse = await this.commonService.httpDelete(url, { ...config, data: payload });
      return deleteResponse?.data ?? null;
    } catch (error) {
      await this.commonService.handleError(error);
      throw error;
    }
  }

  /**
   * Resolve OID4VCI credential offer
   * @param resolveCredentialOfferDetails
   * @returns resolved credential offer
   */
  async resolveCredentialOffer(resolveCredentialOfferDetails: IResolveCredentialOffer): Promise<Response> {
    try {
      const { userId, ...payload } = resolveCredentialOfferDetails;
      delete payload.email;
      const [baseWalletDetails, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
      const { agentEndpoint } = baseWalletDetails;

      const url = `${agentEndpoint}${CommonConstants.OID4VC_HOLDER_RESOLVE_CREDENTIAL_OFFER}`;
      return await this.commonService.httpPost(url, payload, this._holderRequestConfig(decryptedApiKey));
    } catch (error) {
      await this.commonService.handleError(error);
      throw error;
    }
  }

  /**
   * Initiate OID4VCI authorization request
   * @param authorizationRequestDetails
   * @returns authorization request details
   */
  async authorizationRequest(authorizationRequestDetails: IAuthorizeRequestCredential): Promise<Response> {
    try {
      const { userId, ...payload } = authorizationRequestDetails;
      delete payload.email;
      const [baseWalletDetails, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
      const { agentEndpoint } = baseWalletDetails;

      const url = `${agentEndpoint}${CommonConstants.OID4VC_HOLDER_AUTHORIZATION_REQUEST}`;
      return await this.commonService.httpPost(url, payload, this._holderRequestConfig(decryptedApiKey));
    } catch (error) {
      await this.commonService.handleError(error);
      throw error;
    }
  }

  /**
   * Request credential from issuer
   * @param requestCredentialDetails
   * @returns requested credential
   */
  async requestCredential(requestCredentialDetails: IRequestCredential): Promise<Response> {
    try {
      const { userId, ...payload } = requestCredentialDetails;
      delete payload.email;
      const [baseWalletDetails, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
      const { agentEndpoint } = baseWalletDetails;

      const url = `${agentEndpoint}${CommonConstants.OID4VC_HOLDER_REQUEST_CREDENTIAL}`;
      return await this.commonService.httpPost(url, payload, this._holderRequestConfig(decryptedApiKey));
    } catch (error) {
      await this.commonService.handleError(error);
      throw error;
    }
  }

  /**
   * Resolve OID4VP proof request
   * @param resolveProofRequestDetails
   * @returns resolved proof request
   */
  async resolveProofRequest(resolveProofRequestDetails: IResolveProofRequest): Promise<Response> {
    try {
      const { userId, ...payload } = resolveProofRequestDetails;
      delete payload.email;
      const [baseWalletDetails, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
      const { agentEndpoint } = baseWalletDetails;

      const url = `${agentEndpoint}${CommonConstants.OID4VC_HOLDER_RESOLVE_PROOF_REQUEST}`;
      return await this.commonService.httpPost(url, payload, this._holderRequestConfig(decryptedApiKey));
    } catch (error) {
      await this.commonService.handleError(error);
      throw error;
    }
  }

  /**
   * Accept OID4VP proof request
   * @param acceptProofRequestDetails
   * @returns accepted proof presentation
   */
  async acceptProofRequestOid4vc(acceptProofRequestDetails: IAcceptOid4vpProofRequest): Promise<Response> {
    try {
      const { userId, ...payload } = acceptProofRequestDetails;
      delete payload.email;
      const [baseWalletDetails, decryptedApiKey] = await this._commonCloudWalletInfo(userId);
      const { agentEndpoint } = baseWalletDetails;

      const url = `${agentEndpoint}${CommonConstants.OID4VC_HOLDER_ACCEPT_PROOF_REQUEST}`;
      return await this.commonService.httpPost(url, payload, this._holderRequestConfig(decryptedApiKey));
    } catch (error) {
      await this.commonService.handleError(error);
      throw error;
    }
  }

  /**
   * Build the common request config for holder agent calls
   * @param decryptedApiKey
   * @returns http request config
   */
  private _holderRequestConfig(decryptedApiKey: string): { headers: { authorization: string }; timeout: number } {
    const timeout: number = CommonConstants.CLOUD_WALLET_REQUEST_TIMEOUT;
    return {
      headers: { authorization: decryptedApiKey },
      timeout
    };
  }
}
