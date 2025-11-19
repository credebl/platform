import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@credebl/prisma-service';
import { CloudWalletType } from '@credebl/enum/enum';
// eslint-disable-next-line camelcase
import { cloud_wallet_user_info, Prisma, user } from '@prisma/client';
import { BaseAgentInfo, ICloudWalletDetails, IGetStoredWalletInfo, IStoredWalletDetails, IStoreWalletInfo } from '@credebl/common/interfaces/cloud-wallet.interface';
import { UpdateBaseWalletDto } from 'apps/api-gateway/src/cloud-wallet/dtos/cloudWallet.dto';


@Injectable()
export class CloudWalletRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger
  ) {}

 
  // eslint-disable-next-line camelcase
  async getCloudWalletDetails(type: CloudWalletType): Promise<cloud_wallet_user_info | null> {
    try {
      const agentDetails = await this.prisma.cloud_wallet_user_info.findFirst({
        where: {
          type,
          isActive:true
        }
      });
      return agentDetails;
    } catch (error) {
      this.logger.error(`Error in getCloudWalletBaseAgentDetails: ${error.message}`);
      throw error;
    }
  }
  

  // eslint-disable-next-line camelcase
  async getBaseWalletDetails(type: CloudWalletType, user:user): Promise<BaseAgentInfo[]> {
    try {
      const agentDetails = await this.prisma.cloud_wallet_user_info.findMany({
        where: {
          type,
          isActive:true,
          createdBy:user.id
        },
        select: {
          id:true,
          agentEndpoint:true,
          useCount:true,
          maxSubWallets:true
        }
      });
      return agentDetails;
    } catch (error) {
      this.logger.error(`Error in getCloudWalletBaseAgentDetails: ${error.message}`);
      throw error;
    }
  }
  
  // eslint-disable-next-line camelcase
  async updateBaseWalletDetails(type: CloudWalletType, updateBaseWalletDto:UpdateBaseWalletDto): Promise<BaseAgentInfo> {
    try {
      const agentDetails = await this.prisma.cloud_wallet_user_info.update({
        where: {
          id:updateBaseWalletDto.walletId,
          createdBy:updateBaseWalletDto.userId
        },
        data: {
          isActive: updateBaseWalletDto.isActive,
          maxSubWallets:updateBaseWalletDto.maxSubWallets
        },
        select:{
          id:true,
          agentEndpoint:true,
          useCount:true,
          maxSubWallets:true
        }
      });
      return agentDetails;
    } catch (error) {
      this.logger.error(`Error in UpdateCloudWalletBaseAgentDetails: ${error.message}`);
      throw error;
    }
  }

  async updateCloudWalletDetails(
    where: Prisma.cloud_wallet_user_infoWhereUniqueInput,
    data: Prisma.cloud_wallet_user_infoUpdateInput
  // eslint-disable-next-line camelcase
  ): Promise<cloud_wallet_user_info> {
    try {
      const agentDetails = await this.prisma.cloud_wallet_user_info.update({
        where,
        data
      });
      return agentDetails;
    } catch (error) {
      this.logger.error(`Error in UpdateCloudWalletAgentDetails: ${error.message}`);
      throw error;
    }
  }

  // eslint-disable-next-line camelcase
  async checkUserExist(userId: string): Promise<cloud_wallet_user_info> {
    try {
      const agentDetails = await this.prisma.cloud_wallet_user_info.findUnique({
        where: {
          userId
        }
      });
      return agentDetails;
    } catch (error) {
      this.logger.error(`Error in getCloudWalletBaseAgentDetails: ${error.message}`);
      throw error;
    }
  }
  // eslint-disable-next-line camelcase
  async storeCloudWalletDetails(cloudWalletDetails: ICloudWalletDetails): Promise<IStoredWalletDetails> {
    try {
      const {label, lastChangedBy, tenantId, type, userId, agentApiKey, agentEndpoint, email, key, connectionImageUrl} = cloudWalletDetails;

      return await this.prisma.cloud_wallet_user_info.create({
        data: {
          label,
          tenantId,
          email,
          type,
          createdBy: userId,
          lastChangedBy,
          userId,
          agentEndpoint,
          agentApiKey,
          key,
          connectionImageUrl
        },
        select: {
          email: true,
          connectionImageUrl: true,
          createDateTime: true,
          id: true,
          tenantId: true,
          label: true,
          lastChangedDateTime: true
          
        }
      });
    } catch (error) {
      this.logger.error(`Error in storeCloudWalletDetails: ${error.message}`);
      throw error;
    }
  }

  // eslint-disable-next-line camelcase
  async getCloudWalletInfo(userId: string): Promise<cloud_wallet_user_info> {
    try {
      const walletInfoData = await this.prisma.cloud_wallet_user_info.findUnique({
        where: {
          userId
        }
      });
      return walletInfoData;
    } catch (error) {
      this.logger.error(`Error in getCloudWalletInfo: ${error}`);
      throw error;
    }
  }

  async storeCloudWalletInfo(cloudWalletInfoPayload: IStoreWalletInfo): Promise<IGetStoredWalletInfo> {
    try {
      const { agentEndpoint, agentApiKey, email, type, userId, key, createdBy, lastChangedBy, maxSubWallets } = cloudWalletInfoPayload;
      const walletInfoData = await this.prisma.cloud_wallet_user_info.create({
        data: {
          type,
          agentApiKey,
          agentEndpoint,
          email,
          userId,
          key,
          createdBy,
          lastChangedBy,
          maxSubWallets
        },
        select: {
          id: true,
          email: true, 
          type: true,
          userId: true,
          agentEndpoint: true
        }
      });
      return walletInfoData;
    } catch (error) {
      this.logger.error(`Error in storeCloudWalletInfo: ${error}`);
      throw error;
    }
  }

  // eslint-disable-next-line camelcase
  async getCloudSubWallet(userId: string): Promise<cloud_wallet_user_info> {
    try {
      const cloudSubWalletDetails = await this.prisma.cloud_wallet_user_info.findFirstOrThrow({
        where: {
          userId
        }
      });
      return cloudSubWalletDetails;
    } catch (error) {
      this.logger.error(`Error in getCloudSubWallet: ${error}`);
      throw error;
    }
  }

  // eslint-disable-next-line camelcase
  async deleteCloudSubWallet(userId: string): Promise<cloud_wallet_user_info> {
    try {


          const res = this.prisma.cloud_wallet_user_info.delete({
          where: {
            userId
          } 
          });

      
      return res;
    } catch (error) {
      this.logger.error(`Error in getCloudSubWallet: ${error}`);
      throw error;
    }
  }

  async getUserInfo(email: string): Promise<user> {
    try {
      const userDetails = await this.prisma.user.findUnique({
        where: {
          email
        }
      });
      return userDetails;
    } catch (error) {
      this.logger.error(`Error in getUserInfo: ${error}`);
      throw error;
    }
  }
  
}
