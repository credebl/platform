/* eslint-disable camelcase */
import { CommonService } from '@credebl/common';
import { BadRequestException, ConflictException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ICloudWalletDetails, ICreateCloudWallet, IStoredWalletDetails } from '@credebl/common/interfaces/cloud-wallet.interface';
import { CloudWalletRepository } from './cloud-wallet.repository';
import { ResponseMessages } from '@credebl/common/response-messages';
import { CloudWalletType } from '@credebl/enum/enum';
import { CommonConstants } from '@credebl/common/common.constant';
import { IConfigureCloudBaseWallet, IGetStoredWalletInfo } from '../interfaces/cloud-wallet.interface';
import { user } from '@prisma/client';

@Injectable()
export class CloudWalletService {
  constructor(
    private readonly commonService: CommonService,
    @Inject('NATS_CLIENT') private readonly cloudWalletServiceProxy: ClientProxy,
    private readonly cloudWalletRepository: CloudWalletRepository,
    private readonly logger: Logger,
    @Inject(CACHE_MANAGER) private cacheService: Cache
  ) {}

  async configureBaseWallet(cloudBaseWalletConfigure: IConfigureCloudBaseWallet, user: user): Promise<IGetStoredWalletInfo> {
    const { agentEndpoint, apiKey, email, walletKey } = cloudBaseWalletConfigure;

    try {
        const getAgentDetails = await this.commonService.httpGet(`${agentEndpoint}${CommonConstants.URL_AGENT_GET_ENDPOINT}`);
        if (!getAgentDetails?.isInitialized) {
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

        const walletInfoToStore = {
            agentEndpoint,
            apiKey: encryptionApiKey,
            email,
            type: CloudWalletType.BASE_WALLET,
            userId: user.id,
            walletKey: encryptionWalletKey
        };

        const storedWalletInfo = await this.cloudWalletRepository.storeCloudWalletInfo(walletInfoToStore);
        return storedWalletInfo;
    } catch (error) {
        await this.commonService.handleError(error);
        throw error;
    }
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
