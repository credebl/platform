import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
import { SendProofRequestPayload, RequestProofDtoV1, RequestProofDtoV2 } from './dto/request-proof.dto';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { WebhookPresentationProofDto } from './dto/webhook-proof.dto';
import {
  IProofPresentationDetails,
  IProofPresentationList,
  IVerificationRecords
} from '@credebl/common/interfaces/verification.interface';
import { IPresentation, IProofRequest, IProofRequestSearchCriteria } from './interfaces/verification.interface';
import { IProofPresentation } from './interfaces/verification.interface';
// To do make a similar interface in API-gateway
import { user } from '@prisma/client';
import { NATSClient } from '@credebl/common/NATSClient';

@Injectable()
export class VerificationService extends BaseService {
  constructor(
    @Inject('NATS_CLIENT') private readonly verificationServiceProxy: ClientProxy,
    private readonly natsClient: NATSClient
  ) {
    super('VerificationService');
  }

  /**
   * Get all proof presentations
   * @param orgId
   * @returns All proof presentations details
   */
  getProofPresentations(
    proofRequestsSearchCriteria: IProofRequestSearchCriteria,
    user: IUserRequest,
    orgId: string
  ): Promise<IProofPresentationList> {
    const payload = { proofRequestsSearchCriteria, user, orgId };
    return this.natsClient.sendNatsMessage(this.verificationServiceProxy, 'get-all-proof-presentations', payload);
  }

  /**
   * Get proof presentation by proofId
   * @param proofId
   * @param orgId
   * @returns Proof presentation details by proofId
   */
  getProofPresentationById(proofId: string, orgId: string, user: IUserRequest): Promise<IProofPresentation> {
    const payload = { proofId, orgId, user };
    return this.natsClient.sendNatsMessage(
      this.verificationServiceProxy,
      'get-proof-presentations-by-proofId',
      payload
    );
  }

  /**
   * Get verifier proof presentation by issuerId
   * @param issuerId
   * @returns Proof presentation details by issuerId
   */
  getPresentationDetailsByIssuerId(issuerId: string, user: IUserRequest): Promise<number> {
    const payload = { issuerId, user };
    return this.natsClient.sendNatsMessage(
      this.verificationServiceProxy,
      'get-proof-presentation-details-by-issuerId',
      payload
    );
  }

  /**
   * Send proof request
   * @param orgId
   * @returns Requested proof presentation details
   */
  sendProofRequest(requestProofDto: RequestProofDtoV1 | RequestProofDtoV2, user: IUserRequest): Promise<IProofRequest> {
    const payload = { requestProofDto, user };
    return this.natsClient.sendNatsMessage(this.verificationServiceProxy, 'send-proof-request', payload);
  }

  /**
   * Verify proof presentation
   * @param proofId
   * @param orgId
   * @returns Verified proof presentation details
   */
  verifyPresentation(proofId: string, orgId: string, user: IUserRequest): Promise<IPresentation> {
    const payload = { proofId, orgId, user };
    return this.natsClient.sendNatsMessage(this.verificationServiceProxy, 'verify-presentation', payload);
  }

  webhookProofPresentation(orgId: string, proofPresentationPayload: WebhookPresentationProofDto): Promise<object> {
    const payload = { orgId, proofPresentationPayload };
    return this.natsClient.sendNatsMessage(this.verificationServiceProxy, 'webhook-proof-presentation', payload);
  }

  /**
   * Out-Of-Band Proof Presentation
   * @param user
   * @param outOfBandRequestProof
   * @returns Get out-of-band requested proof presentation details
   */
  sendOutOfBandPresentationRequest(
    outOfBandRequestProof: SendProofRequestPayload,
    user: IUserRequest
  ): Promise<object> {
    const payload = { outOfBandRequestProof, user };
    return this.natsClient.sendNatsMessage(this.verificationServiceProxy, 'send-out-of-band-proof-request', payload);
  }

  getVerifiedProofDetails(proofId: string, orgId: string, user: IUserRequest): Promise<IProofPresentationDetails[]> {
    const payload = { proofId, orgId, user };
    return this.natsClient.sendNatsMessage(this.verificationServiceProxy, 'get-verified-proof-details', payload);
  }

  async _getWebhookUrl(tenantId?: string, orgId?: string): Promise<string> {
    const pattern = { cmd: 'get-webhookurl' };
    const payload = { tenantId, orgId };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = await this.verificationServiceProxy.send<any>(pattern, payload).toPromise();
      return message;
    } catch (error) {
      this.logger.error(`catch: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async _postWebhookResponse(webhookUrl: string, data: object): Promise<string> {
    const pattern = { cmd: 'post-webhook-response-to-webhook-url' };
    const payload = { webhookUrl, data };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = await this.verificationServiceProxy.send<any>(pattern, payload).toPromise();
      return message;
    } catch (error) {
      this.logger.error(`catch: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async deleteVerificationRecords(orgId: string, userDetails: user): Promise<IVerificationRecords> {
    const payload = { orgId, userDetails };
    return this.natsClient.sendNatsMessage(this.verificationServiceProxy, 'delete-verification-records', payload);
  }
}
