
import { IAcceptOffer, ICreateCloudWallet, ICreateCloudWalletDid, IReceiveInvitation, IAcceptProofRequest, IProofRequestRes, ICloudBaseWalletConfigure, IGetProofPresentation, IGetProofPresentationById, IGetStoredWalletInfo, IStoredWalletDetails, IWalletDetailsForDidList, IConnectionDetailsById, ITenantDetail, ICredentialDetails, ICreateConnection, IConnectionInvitationResponse, GetAllCloudWalletConnections, IBasicMessage, IBasicMessageDetails, IProofPresentationDetails, IGetCredentialsForRequest, ICredentialForRequestRes, IProofPresentationPayloadWithCred, IDeclineProofRequest, BaseAgentInfo, IW3cCredentials, IDeleteCloudWallet, IExportCloudWallet, ICheckCloudWalletStatus, IAddConnectionType } from '@credebl/common/interfaces/cloud-wallet.interface';
import { Inject, Injectable} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
// eslint-disable-next-line camelcase
import { cloud_wallet_user_info, user } from '@prisma/client';
// import { Prisma } from '@prisma/client';
import { BaseService } from 'libs/service/base.service';
import { UpdateBaseWalletDto } from './dtos/cloudWallet.dto';
import { SelfAttestedCredentialDto } from './dtos/self-attested-credential.dto';

@Injectable()
export class CloudWalletService extends BaseService {
  constructor(@Inject('NATS_CLIENT') private readonly cloudWalletServiceProxy: ClientProxy) {
    super('CloudWalletServiceProxy');
  }

  async configureBaseWallet(
    cloudBaseWalletConfigure: ICloudBaseWalletConfigure
  ): Promise<IGetStoredWalletInfo> {
    return this.sendNatsMessage(this.cloudWalletServiceProxy, 'configure-cloud-base-wallet', cloudBaseWalletConfigure);
  }

    checkCloudWalletStatus(
    acceptProofRequest: ICheckCloudWalletStatus
  ): Promise<IProofRequestRes> {
    return this.sendNatsMessage(this.cloudWalletServiceProxy, 'check-cloud-wallet-status', acceptProofRequest);
  }

  createConnection(
    createConnection: ICreateConnection
  ): Promise<IConnectionInvitationResponse> {
    return this.sendNatsMessage(this.cloudWalletServiceProxy, 'create-connection-by-holder', createConnection);
  }

  acceptProofRequest(
    acceptProofRequest: IAcceptProofRequest
  ): Promise<IProofRequestRes> {
    return this.sendNatsMessage(this.cloudWalletServiceProxy, 'accept-proof-request-by-holder', acceptProofRequest);
  }

  declineProofRequest(
    acceptProofRequest: IDeclineProofRequest
  ): Promise<IProofRequestRes> {
    return this.sendNatsMessage(this.cloudWalletServiceProxy, 'decline-proof-request-by-holder', acceptProofRequest);
  }

  getProofById(
    proofPresentationByIdPayload: IGetProofPresentationById
  ): Promise<IProofRequestRes> {
    return this.sendNatsMessage(this.cloudWalletServiceProxy, 'get-proof-by-proof-id-holder', proofPresentationByIdPayload);
  }

  submitProofWithCred(
    proofPresentationByIdPayload: IProofPresentationPayloadWithCred
  ): Promise<IProofRequestRes> {
    return this.sendNatsMessage(this.cloudWalletServiceProxy, 'submit-proof-with-cred', proofPresentationByIdPayload);
  }
  getCredentialsForRequest(
    proofPresentationByIdPayload: IGetCredentialsForRequest
  ): Promise<ICredentialForRequestRes> {
    return this.sendNatsMessage(this.cloudWalletServiceProxy, 'get-credentials-for-request', proofPresentationByIdPayload);
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

  async deleteCloudWallet(
    cloudWalletDetails: IDeleteCloudWallet
  // eslint-disable-next-line camelcase
  ): Promise<cloud_wallet_user_info> {
    // eslint-disable-next-line camelcase
    const res: cloud_wallet_user_info = await this.sendNatsMessage(this.cloudWalletServiceProxy, 'delete-cloud-wallet', cloudWalletDetails);
    if (cloudWalletDetails.deleteHolder) {
      await this.sendNatsMessage(this.cloudWalletServiceProxy, 'delete-user', res.userId);
    }
    return res;
  }


  getBaseWalletDetails(user: user): Promise<BaseAgentInfo[]> {
    return this.sendNatsMessage(this.cloudWalletServiceProxy, 'get-base-wallet-details', user);
  }
  
  updateBaseWalletDetails(updateBaseWalletDto: UpdateBaseWalletDto): Promise<BaseAgentInfo[]> {
    return this.sendNatsMessage(this.cloudWalletServiceProxy, 'update-base-wallet-details', updateBaseWalletDto);
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

  exportWallet(exportWallet: IExportCloudWallet): Promise<Response> {
  return this.sendNatsMessage(this.cloudWalletServiceProxy, 'export-cloud-wallet', exportWallet);
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

addConnectionTypeById(
  connectionDetails: IAddConnectionType
): Promise<Response> {
  return this.sendNatsMessage(this.cloudWalletServiceProxy, 'Add-cloud-wallet-connection--type-by-id', connectionDetails);
}

getAllconnectionById(
  connectionDetails: GetAllCloudWalletConnections
): Promise<Response> {
  return this.sendNatsMessage(this.cloudWalletServiceProxy, 'get-all-cloud-wallet-connections-list-by-id', connectionDetails);
}

getCredentialList(
  tenantDetails: ITenantDetail
): Promise<Response> {
  return this.sendNatsMessage(this.cloudWalletServiceProxy, 'wallet-credential-by-id', tenantDetails);
}

getAllW3cCredentials(
  w3cCredentials: IW3cCredentials
): Promise<Response> {
  return this.sendNatsMessage(this.cloudWalletServiceProxy, 'get-all-w3c-credenentials', w3cCredentials);
}

getW3cCredentialByCredentialRecordId(
  w3CcredentialDetail: IW3cCredentials
): Promise<Response> {
  return this.sendNatsMessage(this.cloudWalletServiceProxy, 'get-w3c-credential-by-record-id', w3CcredentialDetail);
}

getCredentialByCredentialRecordId(
  credentialDetails: ICredentialDetails
): Promise<Response> {
  return this.sendNatsMessage(this.cloudWalletServiceProxy, 'wallet-credential-by-record-id', credentialDetails);
}

getCredentialFormatDataByCredentialRecordId(
  credentialDetails: ICredentialDetails
): Promise<Response> {
  return this.sendNatsMessage(this.cloudWalletServiceProxy, 'wallet-credentialFormatData-by-record-id', credentialDetails);
}

getProofFormatDataByProofRecordId(
  credentialDetails: IProofPresentationDetails
): Promise<Response> {
  return this.sendNatsMessage(this.cloudWalletServiceProxy, 'wallet-Proof-presentation-FormatData-by-record-id', credentialDetails);
}

deleteCredentialByCredentialRecordId(
  credentialDetails: ICredentialDetails
): Promise<Response> {
  return this.sendNatsMessage(this.cloudWalletServiceProxy, 'delete-credential-by-record-id', credentialDetails);
}

deleteW3cCredentialByCredentialRecordId(
  credentialDetails: ICredentialDetails
): Promise<Response> {
  return this.sendNatsMessage(this.cloudWalletServiceProxy, 'delete-w3c-credential-by-record-id', credentialDetails);
}

getBasicMessageByConnectionId(
  connectionDetails: IBasicMessage
): Promise<Response> {
  return this.sendNatsMessage(this.cloudWalletServiceProxy, 'basic-message-list-by-connection-id', connectionDetails);
}

sendBasicMessage(
  messageDetails: IBasicMessageDetails
): Promise<Response> {
  return this.sendNatsMessage(this.cloudWalletServiceProxy, 'send-basic-message', messageDetails);
}

createSelfAttestedW3cCredential(selfAttestedCredentialDto: SelfAttestedCredentialDto): Promise<Response> {
    return this.sendNatsMessage(this.cloudWalletServiceProxy, 'create-self-attested-w3c-credential', selfAttestedCredentialDto);
}
}
