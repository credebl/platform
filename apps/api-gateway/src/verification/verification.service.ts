import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
import { OutOfBandRequestProof, RequestProof } from './dto/request-proof.dto';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { WebhookPresentationProofDto } from './dto/webhook-proof.dto';
import { IProofRequestSearchCriteria } from './interfaces/verification.interface';
import { IProofPresentationList } from '@credebl/common/interfaces/verification.interface';


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
     * Get proof presentation by id
     * @param id 
     * @param orgId 
     * @param user 
     * @returns Get proof presentation details
     */
    getProofPresentationById(id: string, orgId: string, user: IUserRequest): Promise<{ response: object }> {
        const payload = { id, orgId, user };
        return this.sendNats(this.verificationServiceProxy, 'get-proof-presentations-by-id', payload);
    }

    /**
     * Request proof presentation
     * @param requestProof 
     * @param user 
     * @returns Get requested proof presentation details
     */
    sendProofRequest(requestProof: RequestProof, user: IUserRequest): Promise<{ response: object }> {
        const payload = { requestProof, user };
        return this.sendNats(this.verificationServiceProxy, 'send-proof-request', payload);
    }

    /**
     * Request proof presentation
     * @param id 
     * @param orgId 
     * @param user 
     * @returns Get requested proof presentation details
     */
    verifyPresentation(id: string, orgId: string, user: IUserRequest): Promise<{ response: object }> {
        const payload = { id, orgId, user };
        return this.sendNats(this.verificationServiceProxy, 'verify-presentation', payload);
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
    sendOutOfBandPresentationRequest(outOfBandRequestProof: OutOfBandRequestProof, user: IUserRequest): Promise<{ response: object }> {
        const payload = { outOfBandRequestProof, user };
        return this.sendNats(this.verificationServiceProxy, 'send-out-of-band-proof-request', payload);
    }

     
    getProofFormData(id: string, orgId: string, user: IUserRequest): Promise<{ response: object }> {
        const payload = { id, orgId, user };       
        return this.sendNats(this.verificationServiceProxy, 'proof-form-data', payload);
    }

}
