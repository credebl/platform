import { OpenId4VcVerificationPresentationState } from '@credebl/common/interfaces/oid4vp-verification';
import { organisation } from '@prisma/client';
export interface OrgAgent {
  organisation: organisation;
  id: string;
  createDateTime: Date;
  createdBy: string;
  lastChangedDateTime: Date;
  lastChangedBy: string;
  orgDid: string;
  verkey: string;
  agentEndPoint: string;
  agentId: string;
  isDidPublic: boolean;
  ledgerId: string;
  orgAgentTypeId: string;
  tenantId: string;
}

export interface VerificationSessionQuery {
  publicVerifierId?: string;
  payloadState?: string;
  state?: OpenId4VcVerificationPresentationState;
  authorizationRequestUri?: string;
  nonce?: string;
  id?: string;
}
