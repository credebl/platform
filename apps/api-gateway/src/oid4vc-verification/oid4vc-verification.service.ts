import { NATSClient } from '@credebl/common/NATSClient';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
// eslint-disable-next-line camelcase
import { oid4vp_verifier, user } from '@prisma/client';
import { CreateVerifierDto, UpdateVerifierDto } from './dtos/oid4vc-verifier.dto';
import { VerificationPresentationQueryDto } from './dtos/oid4vc-verifier-presentation.dto';
import { Oid4vpPresentationWhDto } from '../oid4vc-issuance/dtos/oid4vp-presentation-wh.dto';

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
    this.logger.debug(`[oid4vpCreateVerifier] Called with orgId=${orgId}, user=${userDetails?.id}`);
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
    this.logger.debug(
      `[oid4vpUpdateVerifier] Called with orgId=${orgId}, verifierId=${verifierId}, user=${userDetails?.id}`
    );
    return this.natsClient.sendNatsMessage(this.oid4vpProxy, 'oid4vp-verifier-update', payload);
  }

  async oid4vpGetVerifier(orgId, verifierId?: string): Promise<object> {
    const payload = { orgId, verifierId };
    this.logger.debug(`[oid4vpGetVerifier] Called with orgId=${orgId}, verifierId=${verifierId ?? 'N/A'}`);
    return this.natsClient.sendNatsMessage(this.oid4vpProxy, 'oid4vp-verifier-get', payload);
  }

  async oid4vpDeleteVerifier(orgId, verifierId: string): Promise<object> {
    const payload = { orgId, verifierId };
    this.logger.debug(`[oid4vpDeleteVerifier] Called with orgId=${orgId}, verifierId=${verifierId}`);
    return this.natsClient.sendNatsMessage(this.oid4vpProxy, 'oid4vp-verifier-delete', payload);
  }

  async oid4vpGetVerifierSession(orgId, query?: VerificationPresentationQueryDto): Promise<object> {
    const payload = { orgId, query };
    this.logger.debug(
      `[oid4vpGetVerifierSession] Called with orgId=${orgId}, queryParams=${Object.keys(query || {}).length}`
    );
    return this.natsClient.sendNatsMessage(this.oid4vpProxy, 'oid4vp-verifier-session-get', payload);
  }
  async getVerificationSessionResponse(orgId, verificationSessionId: string): Promise<object> {
    const payload = { orgId, verificationSessionId };
    this.logger.debug(
      `[getVerificationSessionResponse] Called with orgId=${orgId}, verificationSessionId=${verificationSessionId}`
    );
    return this.natsClient.sendNatsMessage(this.oid4vpProxy, 'oid4vp-verifier-session-response-get', payload);
  }

  async oid4vpCreateVerificationSession(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sessionRequest: any,
    orgId: string,
    userDetails: user,
    verifierId?: string
  ): Promise<object> {
    const payload = { sessionRequest, orgId, verifierId, userDetails };
    this.logger.debug(
      `[oid4vpCreateVerificationSession] Called with orgId=${orgId}, verifierId=${verifierId ?? 'N/A'}, user=${userDetails?.id ?? 'N/A'}`
    );
    return this.natsClient.sendNatsMessage(this.oid4vpProxy, 'oid4vp-verification-session-create', payload);
  }

  oid4vpPresentationWebhook(
    oid4vpPresentationWhDto: Oid4vpPresentationWhDto,
    id: string
  ): Promise<{
    response: object;
  }> {
    const payload = { oid4vpPresentationWhDto, id };
    return this.natsClient.sendNats(this.oid4vpProxy, 'webhook-oid4vp-presentation', payload);
  }
}
