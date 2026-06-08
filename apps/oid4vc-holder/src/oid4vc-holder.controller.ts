import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Oid4vcHolderService } from './oid4vc-holder.service';
import {
  IOidcHolderAcceptProofRequest,
  IOidcHolderRequestCredential,
  IOidcHolderResolveCredentialOffer,
  IOidcHolderResolveProofRequest
} from './interfaces/oid4vc-holder.interface';

@Controller()
export class Oid4vcHolderController {
  constructor(private readonly oid4vcHolderService: Oid4vcHolderService) {}

  @MessagePattern({ cmd: 'oid4vc-holder-resolve-credential-offer' })
  async oidcHolderResolveCredentialOffer(payload: {
    orgId: string;
    holderPayload: IOidcHolderResolveCredentialOffer;
  }): Promise<object> {
    return this.oid4vcHolderService.oidcHolderResolveCredentialOffer(payload.orgId, payload.holderPayload);
  }

  @MessagePattern({ cmd: 'oid4vc-holder-request-credential' })
  async oidcHolderRequestCredential(payload: {
    orgId: string;
    holderPayload: IOidcHolderRequestCredential;
  }): Promise<object> {
    return this.oid4vcHolderService.oidcHolderRequestCredential(payload.orgId, payload.holderPayload);
  }

  @MessagePattern({ cmd: 'oid4vc-holder-resolve-proof-request' })
  async oidcHolderResolveProofRequest(payload: {
    orgId: string;
    holderPayload: IOidcHolderResolveProofRequest;
  }): Promise<object> {
    return this.oid4vcHolderService.oidcHolderResolveProofRequest(payload.orgId, payload.holderPayload);
  }

  @MessagePattern({ cmd: 'oid4vc-holder-accept-proof-request' })
  async oidcHolderAcceptProofRequest(payload: {
    orgId: string;
    holderPayload: IOidcHolderAcceptProofRequest;
  }): Promise<object> {
    return this.oid4vcHolderService.oidcHolderAcceptProofRequest(payload.orgId, payload.holderPayload);
  }
}
