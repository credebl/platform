import {
  IAcceptOffer,
  ICreateCloudWallet,
  ICreateCloudWalletDid,
  ICreateCloudWalletDidImportSession,
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
  IBasicMessageDetails,
  IResolveCredentialOffer,
  IAuthorizeRequestCredential,
  IRequestCredential,
  IResolveProofRequest,
  IAcceptOid4vpProofRequest,
  IDecodeMdoc,
  IDecodeSdJwt,
  IDeleteHolderCredential
} from '@credebl/common/interfaces/cloud-wallet.interface';
import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { BaseService } from 'libs/service/base.service';
import { NATSClient } from '@credebl/common/NATSClient';
import { ClientProxy } from '@nestjs/microservices';
import { ResponseMessages } from '@credebl/common/response-messages';
import {
  IHolderPrimaryDid,
  IHolderPrimaryDidScope,
  IHolderWalletInfo
} from 'apps/organization/interfaces/organization.interface';

@Injectable()
export class CloudWalletService extends BaseService {
  constructor(
    @Inject('NATS_CLIENT') private readonly cloudWalletServiceProxy: ClientProxy,
    private readonly natsClient: NATSClient,
    @Inject('ORGANIZATION_NATS_CLIENT') private readonly organizationServiceProxy: ClientProxy
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

  createDidImportSession(sessionDetails: ICreateCloudWalletDidImportSession): Promise<Response> {
    return this.natsClient.sendNatsMessage(
      this.cloudWalletServiceProxy,
      'create-cloud-wallet-did-import-session',
      sessionDetails
    );
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

  getSdJwtCredentials(holderDetails: IWalletDetailsForDidList): Promise<Response> {
    return this.natsClient.sendNatsMessage(this.cloudWalletServiceProxy, 'holder-sd-jwt-credentials', holderDetails);
  }

  getMdocCredentials(holderDetails: IWalletDetailsForDidList): Promise<Response> {
    return this.natsClient.sendNatsMessage(this.cloudWalletServiceProxy, 'holder-mdoc-credentials', holderDetails);
  }

  getW3cCredentials(holderDetails: IWalletDetailsForDidList): Promise<Response> {
    return this.natsClient.sendNatsMessage(this.cloudWalletServiceProxy, 'holder-w3c-credentials', holderDetails);
  }

  decodeMdoc(decodeMdocDetails: IDecodeMdoc): Promise<Response> {
    return this.natsClient.sendNatsMessage(this.cloudWalletServiceProxy, 'holder-decode-mdoc', decodeMdocDetails);
  }

  decodeSdJwt(decodeSdJwtDetails: IDecodeSdJwt): Promise<Response> {
    return this.natsClient.sendNatsMessage(this.cloudWalletServiceProxy, 'holder-decode-sdjwt', decodeSdJwtDetails);
  }

  deleteHolderCredential(deleteCredentialDetails: IDeleteHolderCredential): Promise<Response> {
    return this.natsClient.sendNatsMessage(
      this.cloudWalletServiceProxy,
      'holder-delete-credential',
      deleteCredentialDetails
    );
  }

  resolveCredentialOffer(resolveCredentialOfferDetails: IResolveCredentialOffer): Promise<Response> {
    return this.natsClient.sendNatsMessage(
      this.cloudWalletServiceProxy,
      'oid4vc-holder-resolve-credential-offer',
      resolveCredentialOfferDetails
    );
  }

  authorizationRequest(authorizationRequestDetails: IAuthorizeRequestCredential): Promise<Response> {
    return this.natsClient.sendNatsMessage(
      this.cloudWalletServiceProxy,
      'oid4vc-holder-authorization-request',
      authorizationRequestDetails
    );
  }

  requestCredential(requestCredentialDetails: IRequestCredential): Promise<Response> {
    return this.natsClient.sendNatsMessage(
      this.cloudWalletServiceProxy,
      'oid4vc-holder-request-credential',
      requestCredentialDetails
    );
  }

  resolveProofRequest(resolveProofRequestDetails: IResolveProofRequest): Promise<Response> {
    return this.natsClient.sendNatsMessage(
      this.cloudWalletServiceProxy,
      'oid4vc-holder-resolve-proof-request',
      resolveProofRequestDetails
    );
  }

  acceptProofRequestOid4vc(acceptProofRequestDetails: IAcceptOid4vpProofRequest): Promise<Response> {
    return this.natsClient.sendNatsMessage(
      this.cloudWalletServiceProxy,
      'oid4vc-holder-accept-proof-request',
      acceptProofRequestDetails
    );
  }

  /**
   * Primary DID suggestion APIs. These are UI-only preferences: nothing here adds a holderDidUrl to a
   * credential request, and the fresh-key option remains the default in the wallet UI.
   */
  findHolderWallet(payload: { userId: string; holderTenantId?: string }): Promise<IHolderWalletInfo | null> {
    return this.natsClient.sendNatsMessage(this.organizationServiceProxy, 'find-holder-wallet', payload);
  }

  getHolderPrimaryDid(scope: IHolderPrimaryDidScope): Promise<IHolderPrimaryDid | null> {
    return this.natsClient.sendNatsMessage(this.organizationServiceProxy, 'get-holder-primary-did', scope);
  }

  setHolderPrimaryDid(preference: IHolderPrimaryDid): Promise<IHolderPrimaryDid> {
    return this.natsClient.sendNatsMessage(this.organizationServiceProxy, 'set-holder-primary-did', preference);
  }

  deleteHolderPrimaryDid(scope: IHolderPrimaryDidScope): Promise<boolean> {
    return this.natsClient.sendNatsMessage(this.organizationServiceProxy, 'delete-holder-primary-did', scope);
  }

  async getHolderPrimaryDidForUser(orgId: string, userId: string): Promise<IHolderPrimaryDid | null> {
    const wallet = await this.findHolderWallet({ userId });
    if (!wallet?.tenantId) {
      return null;
    }
    return this.getHolderPrimaryDid({ orgId, userId, holderTenantId: wallet.tenantId });
  }

  async setHolderPrimaryDidForUser(
    orgId: string,
    userId: string,
    email: string,
    didUrl: string,
    holderTenantId: string
  ): Promise<IHolderPrimaryDid> {
    const wallet = await this.findHolderWallet({ userId, holderTenantId });
    if (!wallet?.tenantId || wallet.tenantId !== holderTenantId) {
      throw new ForbiddenException(ResponseMessages.holderPrimaryDid.error.accessDenied);
    }

    let didList: unknown[];
    try {
      didList = (await this.getDidList({ userId, email })) ?? [];
    } catch (error) {
      this.logger.error('Could not load holder DIDs while validating a primary DID suggestion');
      throw new BadRequestException(ResponseMessages.holderPrimaryDid.error.notFound);
    }

    if (!this.holderHasDid(didList, didUrl)) {
      throw new BadRequestException(ResponseMessages.holderPrimaryDid.error.notFound);
    }

    return this.setHolderPrimaryDid({ orgId, userId, holderTenantId, didUrl });
  }

  async deleteHolderPrimaryDidForUser(orgId: string, userId: string): Promise<boolean> {
    const wallet = await this.findHolderWallet({ userId });
    if (!wallet?.tenantId) {
      return false;
    }
    return this.deleteHolderPrimaryDid({ orgId, userId, holderTenantId: wallet.tenantId });
  }

  /** Accepts a bare DID or a DID URL whose verification method is listed in the holder tenant's DID document. */
  private holderHasDid(didList: unknown[], didUrl: string): boolean {
    const [bareDid, fragment] = didUrl.split('#');

    return didList.some((entry) => {
      if (!entry || 'object' !== typeof entry) {
        return false;
      }
      const record = entry as {
        did?: string;
        didUrl?: string;
        id?: string;
        didDocument?: { verificationMethod?: { id?: string }[] };
      };
      const candidate = record.didUrl ?? record.did ?? record.id;

      if (candidate !== didUrl && candidate !== bareDid) {
        return false;
      }
      if (!fragment) {
        return true;
      }

      const methods = record.didDocument?.verificationMethod;
      return (
        !Array.isArray(methods) ||
        methods.some((method) => method?.id === didUrl || true === method?.id?.endsWith(`#${fragment}`))
      );
    });
  }
}
