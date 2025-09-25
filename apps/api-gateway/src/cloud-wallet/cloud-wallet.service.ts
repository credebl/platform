import {
  IAcceptOffer,
  ICreateCloudWallet,
  ICreateCloudWalletDid,
  IReceiveInvitation,
  IAcceptProofRequest,
  IProofRequestRes,
  ICloudBaseWalletConfigure,
  IGetProofPresentation,
  IGetProofPresentationById,
  IGetStoredWalletInfo,
  IStoredWalletDetails,
  IWalletDetailsForDidList,
  IConnectionDetailsById,
  ITenantDetail,
  ICredentialDetails,
  ICreateConnection,
  IConnectionInvitationResponse,
  GetAllCloudWalletConnections,
  IBasicMessage,
  IBasicMessageDetails
} from '@credebl/common/interfaces/cloud-wallet.interface';
import { Inject, Injectable } from '@nestjs/common';
import { BaseService } from 'libs/service/base.service';
import { NATSClient } from '@credebl/common/NATSClient';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class CloudWalletService extends BaseService {
  constructor(
    @Inject('NATS_CLIENT') private readonly cloudWalletServiceProxy: ClientProxy,
    private readonly natsClient: NATSClient
  ) {
    super('CloudWalletServiceProxy');
  }

  configureBaseWallet(cloudBaseWalletConfigure: ICloudBaseWalletConfigure): Promise<IGetStoredWalletInfo> {
    return this.natsClient.sendNatsMessage(
      this.cloudWalletServiceProxy,
      'configure-cloud-base-wallet',
      cloudBaseWalletConfigure
    );
  }

  createConnection(createConnection: ICreateConnection): Promise<IConnectionInvitationResponse> {
    return this.natsClient.sendNatsMessage(
      this.cloudWalletServiceProxy,
      'create-connection-by-holder',
      createConnection
    );
  }

  acceptProofRequest(acceptProofRequest: IAcceptProofRequest): Promise<IProofRequestRes> {
    return this.natsClient.sendNatsMessage(
      this.cloudWalletServiceProxy,
      'accept-proof-request-by-holder',
      acceptProofRequest
    );
  }

  getProofById(proofPresentationByIdPayload: IGetProofPresentationById): Promise<IProofRequestRes> {
    return this.natsClient.sendNatsMessage(
      this.cloudWalletServiceProxy,
      'get-proof-by-proof-id-holder',
      proofPresentationByIdPayload
    );
  }

  getProofPresentation(proofPresentationPayload: IGetProofPresentation): Promise<IProofRequestRes[]> {
    return this.natsClient.sendNatsMessage(
      this.cloudWalletServiceProxy,
      'get-proof-presentation-holder',
      proofPresentationPayload
    );
  }

  createCloudWallet(cloudWalletDetails: ICreateCloudWallet): Promise<IStoredWalletDetails> {
    return this.natsClient.sendNatsMessage(this.cloudWalletServiceProxy, 'create-cloud-wallet', cloudWalletDetails);
  }

  receiveInvitationByUrl(ReceiveInvitationDetails: IReceiveInvitation): Promise<Response> {
    return this.natsClient.sendNatsMessage(
      this.cloudWalletServiceProxy,
      'receive-invitation-by-url',
      ReceiveInvitationDetails
    );
  }

  acceptOffer(acceptOfferDetails: IAcceptOffer): Promise<Response> {
    return this.natsClient.sendNatsMessage(this.cloudWalletServiceProxy, 'accept-credential-offer', acceptOfferDetails);
  }

  createDid(createDidDetails: ICreateCloudWalletDid): Promise<Response> {
    return this.natsClient.sendNatsMessage(this.cloudWalletServiceProxy, 'create-cloud-wallet-did', createDidDetails);
  }

  getDidList(walletDetails: IWalletDetailsForDidList): Promise<IProofRequestRes[]> {
    return this.natsClient.sendNatsMessage(this.cloudWalletServiceProxy, 'cloud-wallet-did-list', walletDetails);
  }

  getconnectionById(connectionDetails: IConnectionDetailsById): Promise<Response> {
    return this.natsClient.sendNatsMessage(
      this.cloudWalletServiceProxy,
      'get-cloud-wallet-connection-by-id',
      connectionDetails
    );
  }
  getAllconnectionById(connectionDetails: GetAllCloudWalletConnections): Promise<Response> {
    return this.natsClient.sendNatsMessage(
      this.cloudWalletServiceProxy,
      'get-all-cloud-wallet-connections-list-by-id',
      connectionDetails
    );
  }

  getCredentialList(tenantDetails: ITenantDetail): Promise<Response> {
    return this.natsClient.sendNatsMessage(this.cloudWalletServiceProxy, 'wallet-credential-by-id', tenantDetails);
  }

  getCredentialByCredentialRecordId(credentialDetails: ICredentialDetails): Promise<Response> {
    return this.natsClient.sendNatsMessage(
      this.cloudWalletServiceProxy,
      'wallet-credential-by-record-id',
      credentialDetails
    );
  }

  getBasicMessageByConnectionId(connectionDetails: IBasicMessage): Promise<Response> {
    return this.natsClient.sendNatsMessage(
      this.cloudWalletServiceProxy,
      'basic-message-list-by-connection-id',
      connectionDetails
    );
  }

  sendBasicMessage(messageDetails: IBasicMessageDetails): Promise<Response> {
    return this.natsClient.sendNatsMessage(this.cloudWalletServiceProxy, 'send-basic-message', messageDetails);
  }
}
