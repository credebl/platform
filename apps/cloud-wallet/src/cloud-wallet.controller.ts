/* eslint-disable @typescript-eslint/no-explicit-any */
import { Controller } from '@nestjs/common'; // Import the common service in the library
import { CloudWalletService } from './cloud-wallet.service'; // Import the common service in connection module
import { MessagePattern } from '@nestjs/microservices'; // Import the nestjs microservices package
import { ICreateCloudWallet, IStoredWalletDetails } from '@credebl/common/interfaces/cloud-wallet.interface';
import { IAcceptProofRequestPayload, IConfigureCloudBaseWalletPayload, IGetStoredWalletInfo, IProofByProofId, IProofPresentation } from '../interfaces/cloud-wallet.interface';

@Controller()
export class CloudWalletController {
  constructor(private readonly cloudWalletService: CloudWalletService) {}

  @MessagePattern({ cmd: 'configure-cloud-base-wallet' })
  async configureBaseWallet(payload: IConfigureCloudBaseWalletPayload): Promise<IGetStoredWalletInfo> {
    return this.cloudWalletService.configureBaseWallet(payload.cloudBaseWalletConfigure);
  }

  @MessagePattern({ cmd: 'accept-proof-request-by-holder' })
  async acceptProofRequest(payload: IAcceptProofRequestPayload): Promise<object> {
    return this.cloudWalletService.acceptProofRequest(payload.acceptProofRequest, payload.user);
  }

  @MessagePattern({ cmd: 'get-proof-by-proof-id-holder' })
  async getProofById(payload: IProofByProofId): Promise<object> {
    return this.cloudWalletService.getProofById(payload.proofId, payload.user);
  }

  @MessagePattern({ cmd: 'get-proof-presentation-holder' })
  async getProofPresentation(payload: IProofPresentation): Promise<object> {
    return this.cloudWalletService.getProofPresentation(payload.threadId, payload.user);
  }

  @MessagePattern({ cmd: 'create-cloud-wallet' })
  async createConnectionInvitation(cloudWalletDetails: ICreateCloudWallet): Promise<IStoredWalletDetails> {
    return this.cloudWalletService.createCloudWallet(cloudWalletDetails);
  }
}