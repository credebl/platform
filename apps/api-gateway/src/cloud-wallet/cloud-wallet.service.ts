
import { IAcceptProofRequest, IProofRequestRes, ICloudBaseWalletConfigure, ICreateCloudWallet, IGetProofPresentation, IGetProofPresentationById, IGetStoredWalletInfo, IStoredWalletDetails } from '@credebl/common/interfaces/cloud-wallet.interface';
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


}
