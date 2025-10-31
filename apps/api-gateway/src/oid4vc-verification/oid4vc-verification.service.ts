import { NATSClient } from '@credebl/common/NATSClient';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
// eslint-disable-next-line camelcase
import { oid4vp_verifier, user } from '@prisma/client';
import { CreateVerifierDto, UpdateVerifierDto } from './dtos/oid4vc-verifier.dto';
import { VerificationSessionQueryDto } from './dtos/oid4vc-verifier-session.dto';

@Injectable()
export class Oid4vcVerificationService extends BaseService {
  constructor(
    @Inject('NATS_CLIENT') private readonly oid4vpProxy: ClientProxy,
    private readonly natsClient: NATSClient
  ) {
    super('Oid4vcVerificationService');
  }

  async oid4vpCreateVerifier(
    createVerifier: CreateVerifierDto,
    orgId: string,
    userDetails: user
    // eslint-disable-next-line camelcase
  ): Promise<oid4vp_verifier> {
    const payload = { createVerifier, orgId, userDetails };
    return this.natsClient.sendNatsMessage(this.oid4vpProxy, 'oid4vp-verifier-create', payload);
  }

  async oid4vpUpdateVerifier(
    updateVerifier: UpdateVerifierDto,
    orgId: string,
    verifierId: string,
    userDetails: user
    // eslint-disable-next-line camelcase
  ): Promise<oid4vp_verifier> {
    const payload = { updateVerifier, orgId, verifierId, userDetails };
    return this.natsClient.sendNatsMessage(this.oid4vpProxy, 'oid4vp-verifier-update', payload);
  }

  async oid4vpGetVerifier(orgId, verifierId?: string): Promise<object> {
    const payload = { orgId, verifierId };
    return this.natsClient.sendNatsMessage(this.oid4vpProxy, 'oid4vp-verifier-get', payload);
  }

  async oid4vpDeleteVerifier(orgId, verifierId: string): Promise<object> {
    const payload = { orgId, verifierId };
    return this.natsClient.sendNatsMessage(this.oid4vpProxy, 'oid4vp-verifier-delete', payload);
  }

  async oid4vpGetVerifierSession(orgId, query?: VerificationSessionQueryDto): Promise<object> {
    const payload = { orgId, query };
    return this.natsClient.sendNatsMessage(this.oid4vpProxy, 'oid4vp-verifier-session-get', payload);
  }
  async getVerificationSessionResponse(orgId, verificationSessionId: string): Promise<object> {
    const payload = { orgId, verificationSessionId };
    return this.natsClient.sendNatsMessage(this.oid4vpProxy, 'oid4vp-verifier-session-response-get', payload);
  }

  async oid4vpCreateVerificationSession(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sessionRequest: any,
    orgId: string,
    verifierId?: string,
    userDetails?: user
  ): Promise<object> {
    const payload = { sessionRequest, orgId, verifierId, userDetails };
    return this.natsClient.sendNatsMessage(this.oid4vpProxy, 'oid4vp-verification-session-create', payload);
  }
}
