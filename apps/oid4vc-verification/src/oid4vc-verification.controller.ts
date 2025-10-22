import { Controller } from '@nestjs/common';
import { Oid4vpVerificationService } from './oid4vc-verification.service';
import { user } from '@prisma/client';
import { CreateVerifier } from '@credebl/common/interfaces/oid4vp-verification';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class Oid4vpVerificationController {
  constructor(private readonly oid4vpVerificationService: Oid4vpVerificationService) {}

  @MessagePattern({ cmd: 'oid4vp-verifier-create' })
  async oid4vpCreateVerifier(payload: {
    createVerifier: CreateVerifier;
    orgId: string;
    userDetails: user;
  }): Promise<object> {
    const { createVerifier, orgId, userDetails } = payload;
    return this.oid4vpVerificationService.oid4vpCreateVerifier(createVerifier, orgId, userDetails);
  }

  @MessagePattern({ cmd: 'oid4vp-verifier-get' })
  async oid4vpGetVerifier(payload: { verifierId: string }): Promise<object> {
    const { verifierId } = payload;
    return this.oid4vpVerificationService.getVerifierById(verifierId);
  }
}
