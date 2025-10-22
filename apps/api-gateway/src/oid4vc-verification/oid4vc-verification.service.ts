import { NATSClient } from '@credebl/common/NATSClient';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
// eslint-disable-next-line camelcase
import { oid4vp_verifier, user } from '@prisma/client';
import { CreateVerifierDto } from './dtos/oid4vc-verifier.dto';

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

  async oid4vpGetVerifier(verifierId: string): Promise<object> {
    const payload = { verifierId };
    return this.natsClient.sendNatsMessage(this.oid4vpProxy, 'oid4vp-verifier-get', payload);
  }
}
