import { ClientIdPrefix, SignerMethodOption } from '@credebl/enum/enum';

export interface Oid4vpPresentationWh {
  id: string;
  state: string;
  createdAt: string;
  updatedAt: string;
  contextCorrelationId: string;
  authorizationRequestId: string;
  verifierId: string;
}

export interface DidSigner {
  method: SignerMethodOption.DID;
  didUrl: string;
}

export interface X5cSigner {
  method: SignerMethodOption.X5C;
  x5c: string[];
  keyId: string;
  clientIdPrefix?: ClientIdPrefix;
}

export type RequestSigner = DidSigner | X5cSigner;

export interface VerifyAuthorizationResponse {
  verificationSessionId: string;
  authorizationResponse: Record<string, unknown>;
  origin?: string;
}
