/* eslint-disable camelcase */
import { CommonService } from '@credebl/common';
import { BadRequestException, ConflictException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { IAcceptOffer, ICloudWalletDetails, ICreateCloudWallet, ICreateCloudWalletDid, IReceiveInvitation, IStoredWalletDetails } from '@credebl/common/interfaces/cloud-wallet.interface';
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
   * Create clous wallet
   * @param cloudWalletDetails
   * @returns cloud wallet details
   */
  async createCloudWallet(cloudWalletDetails: ICreateCloudWallet): Promise<IStoredWalletDetails> {
    try {
      const {label, connectionImageUrl, email, userId} = cloudWalletDetails;
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
     if (!baseWalletDetails) {
      throw new NotFoundException(ResponseMessages.cloudWallet.error.baseWalletNotFound);
     }
     const {agentEndpoint, agentApiKey} = baseWalletDetails;

     const decryptedApiKey = await this.commonService.decryptPassword(agentApiKey);

     
       const url = `${agentEndpoint}${CommonConstants.URL_SHAGENT_CREATE_TENANT}`;
     
      const checkCloudWalletAgentHealth = await this.commonService.checkAgentHealth(agentEndpoint, decryptedApiKey);
      
      if (!checkCloudWalletAgentHealth) {
        throw new NotFoundException(ResponseMessages.cloudWallet.error.agentNotRunning);
      }
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
     const {tenantId} = checkUserExist;

      if (!checkUserExist) {
        throw new ConflictException(ResponseMessages.cloudWallet.error.walletNotExist);
       }
      const baseWalletDetails = await this.cloudWalletRepository.getCloudWalletDetails(CloudWalletType.BASE_WALLET);

      if (!baseWalletDetails) {
       throw new NotFoundException(ResponseMessages.cloudWallet.error.baseWalletNotFound);
      }
     const {agentEndpoint, agentApiKey} = baseWalletDetails;

     const decryptedApiKey = await this.commonService.decryptPassword(agentApiKey);

     const url = `${agentEndpoint}${CommonConstants.RECEIVE_INVITATION_BY_URL}${tenantId}`;
     
    const checkCloudWalletAgentHealth = await this.commonService.checkAgentHealth(agentEndpoint, decryptedApiKey);
      
      if (!checkCloudWalletAgentHealth) {
        throw new NotFoundException(ResponseMessages.cloudWallet.error.agentNotRunning);
      }
      const receiveInvitationResponse = await this.commonService.httpPost(url, invitationDetails, { headers: { authorization: decryptedApiKey } });

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
     const {tenantId} = checkUserExist;

      if (!checkUserExist) {
        throw new ConflictException(ResponseMessages.cloudWallet.error.walletNotExist);
       }
      const baseWalletDetails = await this.cloudWalletRepository.getCloudWalletDetails(CloudWalletType.BASE_WALLET);

      if (!baseWalletDetails) {
       throw new NotFoundException(ResponseMessages.cloudWallet.error.baseWalletNotFound);
      }
     const {agentEndpoint, agentApiKey} = baseWalletDetails;

     const decryptedApiKey = await this.commonService.decryptPassword(agentApiKey);

     const url = `${agentEndpoint}${CommonConstants.ACCEPT_OFFER}${tenantId}`;
     
    const checkCloudWalletAgentHealth = await this.commonService.checkAgentHealth(agentEndpoint, decryptedApiKey);
      
      if (!checkCloudWalletAgentHealth) {
        throw new NotFoundException(ResponseMessages.cloudWallet.error.agentNotRunning);
      }
      const acceptOfferResponse = await this.commonService.httpPost(url, offerDetails, { headers: { authorization: decryptedApiKey } });

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
     const {tenantId} = checkUserExist;

      if (!checkUserExist) {
        throw new ConflictException(ResponseMessages.cloudWallet.error.walletNotExist);
       }
      const baseWalletDetails = await this.cloudWalletRepository.getCloudWalletDetails(CloudWalletType.BASE_WALLET);

      if (!baseWalletDetails) {
       throw new NotFoundException(ResponseMessages.cloudWallet.error.baseWalletNotFound);
      }
     const {agentEndpoint, agentApiKey} = baseWalletDetails;

     const decryptedApiKey = await this.commonService.decryptPassword(agentApiKey);

     const url = `${agentEndpoint}${CommonConstants.URL_SHAGENT_CREATE_DID}${tenantId}`;
     
    const checkCloudWalletAgentHealth = await this.commonService.checkAgentHealth(agentEndpoint, decryptedApiKey);
      
      if (!checkCloudWalletAgentHealth) {
        throw new NotFoundException(ResponseMessages.cloudWallet.error.agentNotRunning);
      }
      const didDetailsResponse = await this.commonService.httpPost(url, didDetails, { headers: { authorization: decryptedApiKey } });

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
}
