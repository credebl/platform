import { Controller } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { MessagePattern } from '@nestjs/microservices';
import { IRequestProof, IWebhookProofPresentation } from './interfaces/verification.interface';
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
  async getProofPresentations(payload: { user: IUserRequest, threadId: string, orgId: number }): Promise<string> {
    return this.verificationService.getProofPresentations(payload.orgId, payload.threadId);
  }

  /**
   * Get proof presentation by id
   * @param payload 
   * @returns Get proof presentation details
   */
  @MessagePattern({ cmd: 'get-proof-presentations-by-id' })
  async getProofPresentationById(payload: { id: string, orgId: number, user: IUserRequest }): Promise<string> {
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
  async verifyPresentation(payload: { id: string, orgId: number, user: IUserRequest }): Promise<string> {
    return this.verificationService.verifyPresentation(payload.id, payload.orgId);
  }

  @MessagePattern({ cmd: 'webhook-proof-presentation' })
  async webhookProofPresentation(payload: { id: string, proofPresentationPayload: IWebhookProofPresentation }): Promise<presentations> {
    return this.verificationService.webhookProofPresentation(payload.id, payload.proofPresentationPayload);
  }

  @MessagePattern({ cmd: 'send-out-of-band-proof-request' })
  async sendOutOfBandPresentationRequest(payload: { outOfBandRequestProof: IRequestProof, user: IUserRequest }): Promise<boolean> {
    return this.verificationService.sendOutOfBandPresentationRequest(payload.outOfBandRequestProof);
  }
}
