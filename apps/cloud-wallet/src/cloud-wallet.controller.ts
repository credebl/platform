/* eslint-disable @typescript-eslint/no-explicit-any */
import { Controller } from '@nestjs/common'; // Import the common service in the library
import { CloudWalletService } from './cloud-wallet.service'; // Import the common service in connection module
import { MessagePattern } from '@nestjs/microservices'; // Import the nestjs microservices package
import { IAcceptOffer, ICreateCloudWallet, ICreateCloudWalletDid, IReceiveInvitation, IStoredWalletDetails } from '@credebl/common/interfaces/cloud-wallet.interface';

@Controller()
export class CloudWalletController {
  constructor(private readonly cloudWalletService: CloudWalletService) {}


  @MessagePattern({ cmd: 'create-cloud-wallet' })
  async createConnectionInvitation(cloudWalletDetails: ICreateCloudWallet): Promise<IStoredWalletDetails> {
    return this.cloudWalletService.createCloudWallet(cloudWalletDetails);
  }

  @MessagePattern({ cmd: 'receive-invitation-by-url' })
  async receiveInvitationByUrl(ReceiveInvitationDetails: IReceiveInvitation): Promise<Response> {
    return this.cloudWalletService.receiveInvitationByUrl(ReceiveInvitationDetails);
  }

  @MessagePattern({ cmd: 'accept-credential-offer' })
  async acceptOffer(acceptOfferDetails: IAcceptOffer): Promise<Response> {
    return this.cloudWalletService.acceptOffer(acceptOfferDetails);
  }

  @MessagePattern({ cmd: 'create-cloud-wallet-did' })
  async createDid(createDidDetails: ICreateCloudWalletDid): Promise<Response> {
    return this.cloudWalletService.createDid(createDidDetails);
  }
}