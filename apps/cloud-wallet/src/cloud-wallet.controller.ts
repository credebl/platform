/* eslint-disable @typescript-eslint/no-explicit-any */
import { Controller } from '@nestjs/common'; // Import the common service in the library
import { CloudWalletService } from './cloud-wallet.service'; // Import the common service in connection module
import { MessagePattern } from '@nestjs/microservices'; // Import the nestjs microservices package
import { IAcceptOffer, ICreateCloudWalletDid, IReceiveInvitation, IAcceptProofRequest, IProofRequestRes, ICloudBaseWalletConfigure, ICreateCloudWallet, IGetProofPresentation, IGetProofPresentationById, IGetStoredWalletInfo, IStoredWalletDetails, ICreateConnection, IConnectionInvitationResponse, IWalletDetailsForDidList, IConnectionDetailsById, ITenantDetail, ICredentialDetails, GetAllCloudWalletConnections, IBasicMessage, IBasicMessageDetails, IProofPresentationDetails, IGetCredentialsForRequest, ICredentialForRequestRes, IProofPresentationPayloadWithCred, IDeclineProofRequest, BaseAgentInfo, ISelfAttestedCredential, IW3cCredentials, ICheckCloudWalletStatus, IDeleteCloudWallet, IExportCloudWallet, IAddConnectionType } from '@credebl/common/interfaces/cloud-wallet.interface';
// eslint-disable-next-line camelcase
import { cloud_wallet_user_info, user as User } from '@prisma/client';
import { UpdateBaseWalletDto } from 'apps/api-gateway/src/cloud-wallet/dtos/cloudWallet.dto';

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

  @MessagePattern({ cmd: 'check-cloud-wallet-status' })
  async checkCloudWalletStatus(createConnection: ICheckCloudWalletStatus): Promise<IConnectionInvitationResponse> {
    return this.cloudWalletService.checkCloudWalletStatus(createConnection);
  }

  @MessagePattern({ cmd: 'accept-proof-request-by-holder' })
  async acceptProofRequest(acceptProofRequestPayload: IAcceptProofRequest): Promise<IProofRequestRes> {
    return this.cloudWalletService.acceptProofRequest(acceptProofRequestPayload);
  }
  
  @MessagePattern({ cmd: 'decline-proof-request-by-holder' })
  async declineProofRequest(declineProofRequestPayload: IDeclineProofRequest): Promise<IProofRequestRes> {
    return this.cloudWalletService.declineProofRequest(declineProofRequestPayload);
  }

  @MessagePattern({ cmd: 'get-proof-by-proof-id-holder' })
  async getProofById(proofPrsentationByIdPayload: IGetProofPresentationById): Promise<IProofRequestRes> {
    return this.cloudWalletService.getProofById(proofPrsentationByIdPayload);
  }

  @MessagePattern({ cmd: 'submit-proof-with-cred' })
  async submitProofWithCred(proofPresentationByIdPayload: IProofPresentationPayloadWithCred): Promise<IProofRequestRes> {
    return this.cloudWalletService.submitProofWithCred(proofPresentationByIdPayload);
  }

  @MessagePattern({ cmd: 'get-credentials-for-request' })
  async getCredentialsForRequest(proofPrsentationByIdPayload: IGetCredentialsForRequest): Promise<ICredentialForRequestRes> {
    return this.cloudWalletService.getCredentialsByProofId(proofPrsentationByIdPayload);
  }

  @MessagePattern({ cmd: 'get-proof-presentation-holder' })
  async getProofPresentation(proofPresentationPayload: IGetProofPresentation): Promise<IProofRequestRes[]> {
    return this.cloudWalletService.getProofPresentation(proofPresentationPayload);
  }

  @MessagePattern({ cmd: 'create-cloud-wallet' })
  async createConnectionInvitation(cloudWalletDetails: ICreateCloudWallet): Promise<IStoredWalletDetails> {
    return this.cloudWalletService.createCloudWallet(cloudWalletDetails);
  }
  
    @MessagePattern({ cmd: 'delete-cloud-wallet' })
  // eslint-disable-next-line camelcase
  async deleteCloudWallet(cloudWalletDetails: IDeleteCloudWallet): Promise<cloud_wallet_user_info> {
    return this.cloudWalletService.deleteCloudWallet(cloudWalletDetails);
  }

  @MessagePattern({ cmd: 'get-base-wallet-details' })
  async getBaseWalletDetails(user:User): Promise<BaseAgentInfo[]> {
    return this.cloudWalletService.getBaseWalletDetails(user);
  }
  
  @MessagePattern({ cmd: 'update-base-wallet-details' })
  async updateBaseWalletDetails(updateBaseWalletDto:UpdateBaseWalletDto): Promise<BaseAgentInfo> {
    return this.cloudWalletService.updateBaseWalletDetails(updateBaseWalletDto);
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
  

  @MessagePattern({ cmd: 'export-cloud-wallet' })
  async exportCloudWallet(exportWallet: IExportCloudWallet): Promise<Response> {
    return this.cloudWalletService.exportCloudWallet(exportWallet);
  }

  @MessagePattern({ cmd: 'cloud-wallet-did-list' })
  async getDidList(walletDetails: IWalletDetailsForDidList): Promise<Response> {
    return this.cloudWalletService.getDidList(walletDetails);
  }

  @MessagePattern({ cmd: 'get-cloud-wallet-connection-by-id' })
  async getconnectionById(connectionDetails: IConnectionDetailsById): Promise<Response> {
    return this.cloudWalletService.getconnectionById(connectionDetails);
  }

  @MessagePattern({ cmd: 'Add-cloud-wallet-connection--type-by-id' })
  async addConnectionTypeById(connectionDetails: IAddConnectionType): Promise<Response> {
    return this.cloudWalletService.AddConnectionTypeById(connectionDetails);
  }

  @MessagePattern({ cmd: 'get-all-cloud-wallet-connections-list-by-id' })
  async getAllconnectionById(connectionDetails: GetAllCloudWalletConnections): Promise<Response> {
    return this.cloudWalletService.getAllconnectionById(connectionDetails);
  }

  @MessagePattern({ cmd: 'wallet-credential-by-id' })
  async getCredentialList(tenantDetails: ITenantDetail): Promise<Response> {
    return this.cloudWalletService.getCredentialListById(tenantDetails);
  }

  @MessagePattern({ cmd: 'get-all-w3c-credenentials' })
  async getAllW3cCredentials(w3cCredential: IW3cCredentials): Promise<Response> {
    return this.cloudWalletService.getAllW3cCredentials(w3cCredential);
  }
  
  @MessagePattern({ cmd: 'wallet-credential-by-record-id' })
  async getCredentialByCredentialRecordId(credentialDetails: ICredentialDetails): Promise<Response> {
    return this.cloudWalletService.getCredentialByRecord(credentialDetails);
  }

  @MessagePattern({ cmd: 'get-w3c-credential-by-record-id' })
  async getW3cCredentialByRecordId(w3cCredential: IW3cCredentials): Promise<Response> {
    return this.cloudWalletService.getW3cCredentialByRecordId(w3cCredential);
  }

  @MessagePattern({ cmd: 'wallet-credentialFormatData-by-record-id' })
  async getCredentialFormatDataByCredentialRecordId(proofDetails: ICredentialDetails): Promise<Response> {
    return this.cloudWalletService.getCredentialFormatDataByRecord(proofDetails);
  }
  
  @MessagePattern({ cmd: 'wallet-Proof-presentation-FormatData-by-record-id' })
  async getProofPresentationFormatDataByCredentialRecordId(credentialDetails: IProofPresentationDetails): Promise<Response> {
    return this.cloudWalletService.getProofFormDataByRecord(credentialDetails);
  }


  @MessagePattern({ cmd: 'delete-credential-by-record-id' })
  async deleteCredentialByCredentialRecordId(credentialDetails: ICredentialDetails): Promise<Response> {
    return this.cloudWalletService.deleteCredentialByRecord(credentialDetails);
  }

  @MessagePattern({ cmd: 'delete-w3c-credential-by-record-id' })
  async deleteW3cCredentialByCredentialRecordId(credentialDetails: ICredentialDetails): Promise<Response> {
    return this.cloudWalletService.deleteW3cCredentialByRecord(credentialDetails);
  }

  @MessagePattern({ cmd: 'basic-message-list-by-connection-id' })
  async getBasicMessageByConnectionId(connectionDetails: IBasicMessage): Promise<Response> {
    return this.cloudWalletService.getBasicMessageByConnectionId(connectionDetails);
  }

  @MessagePattern({ cmd: 'send-basic-message' })
  async sendBasicMessage(messageDetails: IBasicMessageDetails): Promise<Response> {
    return this.cloudWalletService.sendBasicMessage(messageDetails);
  }

  @MessagePattern({ cmd: 'create-self-attested-w3c-credential' })
  async createSelfAttestedW3cCredential(selfAttestedCredential: ISelfAttestedCredential): Promise<Response> {
    return this.cloudWalletService.createSelfAttestedW3cCredential(selfAttestedCredential);
  }
  
}