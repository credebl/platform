
import { IAcceptOffer, ICreateCloudWallet, ICreateCloudWalletDid, IReceiveInvitation, IAcceptProofRequest, IProofRequestRes, ICloudBaseWalletConfigure, IGetProofPresentation, IGetProofPresentationById, IGetStoredWalletInfo, IStoredWalletDetails, IWalletDetailsForDidList, IConnectionDetailsById, ITenantDetail, ICredentialDetails } from '@credebl/common/interfaces/cloud-wallet.interface';
import { Inject, Injectable} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';

@Injectable()
export class CloudWalletService extends BaseService {
  constructor(@Inject('NATS_CLIENT') private readonly cloudWalletServiceProxy: ClientProxy) {
    super('CloudWalletServiceProxy');
  }

  configureBaseWallet(
    cloudBaseWalletConfigure: ICloudBaseWalletConfigure
  ): Promise<IGetStoredWalletInfo> {
    return this.sendNatsMessage(this.cloudWalletServiceProxy, 'configure-cloud-base-wallet', cloudBaseWalletConfigure);
  }

  acceptProofRequest(
    acceptProofRequest: IAcceptProofRequest
  ): Promise<IProofRequestRes> {
    return this.sendNatsMessage(this.cloudWalletServiceProxy, 'accept-proof-request-by-holder', acceptProofRequest);
  }

  getProofById(
    proofPresentationByIdPayload: IGetProofPresentationById
  ): Promise<IProofRequestRes> {
    return this.sendNatsMessage(this.cloudWalletServiceProxy, 'get-proof-by-proof-id-holder', proofPresentationByIdPayload);
  }

  getProofPresentation(
    proofPresentationPayload: IGetProofPresentation
  ): Promise<IProofRequestRes[]> {
    return this.sendNatsMessage(this.cloudWalletServiceProxy, 'get-proof-presentation-holder', proofPresentationPayload);
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

getDidList(
  walletDetails: IWalletDetailsForDidList
): Promise<IProofRequestRes[]> {
  return this.sendNatsMessage(this.cloudWalletServiceProxy, 'cloud-wallet-did-list', walletDetails);
}

getconnectionById(
  connectionDetails: IConnectionDetailsById
): Promise<Response> {
  return this.sendNatsMessage(this.cloudWalletServiceProxy, 'get-cloud-wallet-connection-by-id', connectionDetails);
}

getCredentialList(
  tenantDetails: ITenantDetail
): Promise<Response> {
  return this.sendNatsMessage(this.cloudWalletServiceProxy, 'wallet-credential-by-id', tenantDetails);
}

getCredentialByCredentialRecordId(
  credentialDetails: ICredentialDetails
): Promise<Response> {
  return this.sendNatsMessage(this.cloudWalletServiceProxy, 'wallet-credential-by-record-id', credentialDetails);
}
}
