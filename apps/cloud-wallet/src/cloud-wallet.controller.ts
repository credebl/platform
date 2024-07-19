/* eslint-disable @typescript-eslint/no-explicit-any */
import { Controller } from '@nestjs/common'; // Import the common service in the library
import { CloudWalletService } from './cloud-wallet.service'; // Import the common service in connection module
import { MessagePattern } from '@nestjs/microservices'; // Import the nestjs microservices package
import { IAcceptProofRequest, IProofRequestRes, ICloudBaseWalletConfigure, ICreateCloudWallet, IGetProofPresentation, IGetProofPresentationById, IGetStoredWalletInfo, IStoredWalletDetails } from '@credebl/common/interfaces/cloud-wallet.interface';

@Controller()
export class CloudWalletController {
  constructor(private readonly cloudWalletService: CloudWalletService) {}

  @MessagePattern({ cmd: 'configure-cloud-base-wallet' })
  async configureBaseWallet(configureBaseWalletPayload: ICloudBaseWalletConfigure): Promise<IGetStoredWalletInfo> {
    return this.cloudWalletService.configureBaseWallet(configureBaseWalletPayload);
  }

  @MessagePattern({ cmd: 'accept-proof-request-by-holder' })
  async acceptProofRequest(acceptProofRequestPayload: IAcceptProofRequest): Promise<IProofRequestRes> {
    return this.cloudWalletService.acceptProofRequest(acceptProofRequestPayload);
  }

  @MessagePattern({ cmd: 'get-proof-by-proof-id-holder' })
  async getProofById(proofPrsentationByIdPayload: IGetProofPresentationById): Promise<IProofRequestRes> {
    return this.cloudWalletService.getProofById(proofPrsentationByIdPayload);
  }

  @MessagePattern({ cmd: 'get-proof-presentation-holder' })
  async getProofPresentation(proofPresentationPayload: IGetProofPresentation): Promise<IProofRequestRes[]> {
    return this.cloudWalletService.getProofPresentation(proofPresentationPayload);
  }

  @MessagePattern({ cmd: 'create-cloud-wallet' })
  async createConnectionInvitation(cloudWalletDetails: ICreateCloudWallet): Promise<IStoredWalletDetails> {
    return this.cloudWalletService.createCloudWallet(cloudWalletDetails);
  }
}