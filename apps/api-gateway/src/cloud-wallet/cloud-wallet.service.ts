
import { IAcceptOffer, ICreateCloudWallet, ICreateCloudWalletDid, IReceiveInvitation, IStoredWalletDetails } from '@credebl/common/interfaces/cloud-wallet.interface';
import { Inject, Injectable} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';

@Injectable()
export class CloudWalletService extends BaseService {
  constructor(@Inject('NATS_CLIENT') private readonly cloudWalletServiceProxy: ClientProxy) {
    super('CloudWalletServiceProxy');
  }

  createCloudWallet(
    cloudWalletDetails: ICreateCloudWallet
  ): Promise<IStoredWalletDetails> {
    return this.sendNatsMessage(this.cloudWalletServiceProxy, 'create-cloud-wallet', cloudWalletDetails);
  }

  receiveInvitationByUrl(
    ReceiveInvitationDetails: IReceiveInvitation
  ): Promise<Response> {
    return this.sendNatsMessage(this.cloudWalletServiceProxy, 'receive-invitation-by-url', ReceiveInvitationDetails);
  }

  acceptOffer(
    acceptOfferDetails: IAcceptOffer
  ): Promise<Response> {
    return this.sendNatsMessage(this.cloudWalletServiceProxy, 'accept-credential-offer', acceptOfferDetails);
  }

   createDid(createDidDetails: ICreateCloudWalletDid): Promise<Response> {
    return this.sendNatsMessage(this.cloudWalletServiceProxy, 'create-cloud-wallet-did', createDidDetails);
}

}
