import { SignerMethodOption } from '@credebl/enum/enum';

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
}

export type RequestSigner = DidSigner | X5cSigner;
