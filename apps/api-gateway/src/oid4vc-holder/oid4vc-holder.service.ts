import { NATSClient } from '@credebl/common/NATSClient';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
import {
  OidcAcceptProofRequestDto,
  OidcRequestCredentialDto,
  OidcResolveCredentialOfferDto,
  OidcResolveProofRequestDto
} from './dtos/oid4vc-holder.dto';

@Injectable()
export class Oid4vcHolderService extends BaseService {
  constructor(
    @Inject('NATS_CLIENT') private readonly holderProxy: ClientProxy,
    private readonly natsClient: NATSClient
  ) {
    super('Oid4vcHolderService');
  }

  async oidcHolderResolveCredentialOffer(orgId: string, holderPayload: OidcResolveCredentialOfferDto): Promise<object> {
    const payload = { orgId, holderPayload };
    return this.natsClient.sendNatsMessage(this.holderProxy, 'oid4vc-holder-resolve-credential-offer', payload);
  }

  async oidcHolderRequestCredential(orgId: string, holderPayload: OidcRequestCredentialDto): Promise<object> {
    const payload = { orgId, holderPayload };
    return this.natsClient.sendNatsMessage(this.holderProxy, 'oid4vc-holder-request-credential', payload);
  }

  async oidcHolderResolveProofRequest(orgId: string, holderPayload: OidcResolveProofRequestDto): Promise<object> {
    const payload = { orgId, holderPayload };
    return this.natsClient.sendNatsMessage(this.holderProxy, 'oid4vc-holder-resolve-proof-request', payload);
  }

  async oidcHolderAcceptProofRequest(orgId: string, holderPayload: OidcAcceptProofRequestDto): Promise<object> {
    const payload = { orgId, holderPayload };
    return this.natsClient.sendNatsMessage(this.holderProxy, 'oid4vc-holder-accept-proof-request', payload);
  }
}
