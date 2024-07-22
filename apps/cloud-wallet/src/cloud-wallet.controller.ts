/* eslint-disable @typescript-eslint/no-explicit-any */
import { Controller } from '@nestjs/common'; // Import the common service in the library
import { CloudWalletService } from './cloud-wallet.service'; // Import the common service in connection module
import { MessagePattern } from '@nestjs/microservices'; // Import the nestjs microservices package
import { IAcceptOffer, ICreateCloudWalletDid, IReceiveInvitation, IAcceptProofRequest, IProofRequestRes, ICloudBaseWalletConfigure, ICreateCloudWallet, IGetProofPresentation, IGetProofPresentationById, IGetStoredWalletInfo, IStoredWalletDetails, ICreateConnection, IConnectionInvitationResponse, IWalletDetailsForDidList, IConnectionDetailsById, ITenantDetail, ICredentialDetails } from '@credebl/common/interfaces/cloud-wallet.interface';

@Controller()
export class CloudWalletController {
  constructor(private readonly cloudWalletService: CloudWalletService) {}

  @MessagePattern({ cmd: 'configure-cloud-base-wallet' })
  async configureBaseWallet(configureBaseWalletPayload: ICloudBaseWalletConfigure): Promise<IGetStoredWalletInfo> {
    return this.cloudWalletService.configureBaseWallet(configureBaseWalletPayload);
  }

  @MessagePattern({ cmd: 'create-connection-by-holder' })
  async createConnection(createConnection: ICreateConnection): Promise<IConnectionInvitationResponse> {
    return this.cloudWalletService.createConnection(createConnection);
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

  @MessagePattern({ cmd: 'cloud-wallet-did-list' })
  async getDidList(walletDetails: IWalletDetailsForDidList): Promise<Response> {
    return this.cloudWalletService.getDidList(walletDetails);
  }

  @MessagePattern({ cmd: 'get-cloud-wallet-connection-by-id' })
  async getconnectionById(connectionDetails: IConnectionDetailsById): Promise<Response> {
    return this.cloudWalletService.getconnectionById(connectionDetails);
  }

  @MessagePattern({ cmd: 'wallet-credential-by-id' })
  async getCredentialList(tenantDetails: ITenantDetail): Promise<Response> {
    return this.cloudWalletService.getCredentialListById(tenantDetails);
  }
  
  @MessagePattern({ cmd: 'wallet-credential-by-record-id' })
  async getCredentialByCredentialRecordId(credentialDetails: ICredentialDetails): Promise<Response> {
    return this.cloudWalletService.getCredentialByRecord(credentialDetails);
  }
  
}