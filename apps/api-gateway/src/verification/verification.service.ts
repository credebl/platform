import { Injectable, Inject, HttpException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
import { OutOfBandRequestProof, RequestProofDto } from './dto/request-proof.dto';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { WebhookPresentationProofDto } from './dto/webhook-proof.dto';
import { IProofPresentationDetails, IProofPresentationList } from '@credebl/common/interfaces/verification.interface';
import { IPresentation, IProofRequest, IProofRequestSearchCriteria } from './interfaces/verification.interface';
import { IProofPresentation } from './interfaces/verification.interface';


@Injectable()
export class VerificationService extends BaseService {
    constructor(
        @Inject('NATS_CLIENT') private readonly verificationServiceProxy: ClientProxy
    ) {
        super('VerificationService');
    }

    /**
     * Get all proof presentations
     * @param orgId 
     * @returns All proof presentations details
     */
    getProofPresentations(proofRequestsSearchCriteria: IProofRequestSearchCriteria, user: IUserRequest, orgId: string): Promise<IProofPresentationList> {
        const payload = { proofRequestsSearchCriteria, user, orgId };
        return this.sendNatsMessage(this.verificationServiceProxy, 'get-all-proof-presentations', payload);
    }

    /**
     * Get proof presentation by proofId
     * @param proofId 
     * @param orgId 
     * @returns Proof presentation details by proofId
     */
    getProofPresentationById(proofId: string, orgId: string, user: IUserRequest): Promise<IProofPresentation> {
        const payload = { proofId, orgId, user };
        return this.sendNatsMessage(this.verificationServiceProxy, 'get-proof-presentations-by-proofId', payload);
    }

    /**
     * Send proof request
     * @param orgId 
     * @returns Requested proof presentation details
     */
    sendProofRequest(requestProof: RequestProofDto, user: IUserRequest): Promise<IProofRequest> {
        const payload = { requestProof, user };
        return this.sendNatsMessage(this.verificationServiceProxy, 'send-proof-request', payload);
    }

    /**
     * Verify proof presentation
     * @param proofId 
     * @param orgId 
     * @returns Verified proof presentation details
     */
    verifyPresentation(proofId: string, orgId: string, user: IUserRequest): Promise<IPresentation> {
        const payload = { proofId, orgId, user };
        return this.sendNatsMessage(this.verificationServiceProxy, 'verify-presentation', payload);
    }

    webhookProofPresentation(orgId: string, proofPresentationPayload: WebhookPresentationProofDto): Promise<object> {
        const payload = { orgId, proofPresentationPayload };
        return this.sendNatsMessage(this.verificationServiceProxy, 'webhook-proof-presentation', payload);
    }

    /**
     * Out-Of-Band Proof Presentation
     * @param user 
     * @param outOfBandRequestProof 
     * @returns Get out-of-band requested proof presentation details
     */
    sendOutOfBandPresentationRequest(outOfBandRequestProof: OutOfBandRequestProof, user: IUserRequest): Promise<object> {
        const payload = { outOfBandRequestProof, user };
        return this.sendNatsMessage(this.verificationServiceProxy, 'send-out-of-band-proof-request', payload);
    }
    
    getVerifiedProofDetails(proofId: string, orgId: string, user: IUserRequest): Promise<IProofPresentationDetails[]> {
        const payload = { proofId, orgId, user };       
        return this.sendNatsMessage(this.verificationServiceProxy, 'get-verified-proof-details', payload);
    }

    async _getWebhookUrl(tenantId: string): Promise<string> {
        const pattern = { cmd: 'get-webhookurl' };
        const payload = { tenantId };
    
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const message = await this.verificationServiceProxy.send<any>(pattern, payload).toPromise();
          return message;
        } catch (error) {
          this.logger.error(`catch: ${JSON.stringify(error)}`);
          throw new HttpException({
            status: error.status,
            error: error.message
          }, error.status);
        }
      }
    
      async _postWebhookResponse(webhookUrl: string, data:object): Promise<string> {
        const pattern = { cmd: 'post-webhook-response-to-webhook-url' };
        const payload = { webhookUrl, data  };

        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const message = await this.verificationServiceProxy.send<any>(pattern, payload).toPromise();
          return message;
        } catch (error) {
          this.logger.error(`catch: ${JSON.stringify(error)}`);
          throw new HttpException({
            status: error.status,
            error: error.message
          }, error.status);
        }
      }

}
