import { Controller } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { MessagePattern } from '@nestjs/microservices';
import { IProofPresentation, IProofRequests, IRequestProof, ProofFormData } from './interfaces/verification.interface';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { presentations } from '@prisma/client';

@Controller()
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) { }

  /**
   * Get all proof presentations
   * @param payload 
   * @returns Get all proof presentation
   */
  @MessagePattern({ cmd: 'get-proof-presentations' })
  async getProofPresentations(payload: IProofRequests): Promise<object> {
    const { user, orgId, proofRequestsSearchCriteria} = payload;
    return this.verificationService.getProofPresentations(user, orgId, proofRequestsSearchCriteria);
  }

  /**
   * Get proof presentation by id
   * @param payload 
   * @returns Get proof presentation details
   */
  @MessagePattern({ cmd: 'get-proof-presentations-by-id' })
  async getProofPresentationById(payload: { id: string, orgId: string, user: IUserRequest }): Promise<string> {
    return this.verificationService.getProofPresentationById(payload.id, payload.orgId);
  }

  /**
   * Request proof presentation
   * @param payload 
   * @returns Get requested proof presentation details
   */
  @MessagePattern({ cmd: 'send-proof-request' })
  async sendProofRequest(payload: { requestProof: IRequestProof, user: IUserRequest }): Promise<string> {
    return this.verificationService.sendProofRequest(payload.requestProof);
  }

  /**
   * Verify proof presentation
   * @param payload 
   * @returns Get verified proof presentation details
   */
  @MessagePattern({ cmd: 'verify-presentation' })
  async verifyPresentation(payload: { id: string, orgId: string, user: IUserRequest }): Promise<string> {
    return this.verificationService.verifyPresentation(payload.id, payload.orgId);
  }

  /**
   * @param orgId 
   * @returns proof presentation details
   */
  @MessagePattern({ cmd: 'webhook-proof-presentation' })
  async webhookProofPresentation(payload: IProofPresentation): Promise<presentations> {
    return this.verificationService.webhookProofPresentation(payload);
  }

  @MessagePattern({ cmd: 'send-out-of-band-proof-request' })
  async sendOutOfBandPresentationRequest(payload: { outOfBandRequestProof: IRequestProof, user: IUserRequest }): Promise<boolean> {
    return this.verificationService.sendOutOfBandPresentationRequest(payload.outOfBandRequestProof);
  }

  @MessagePattern({ cmd: 'proof-form-data' })
  async getProofFormData(payload: ProofFormData): Promise<object> {
  
    const { id, orgId } = payload;
   
    return this.verificationService.getProofFormData(id, orgId);
  }
}
