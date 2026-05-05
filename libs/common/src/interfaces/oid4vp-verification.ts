import { ClientIdPrefix } from '@credebl/enum/enum';
import { SignerOption } from '@prisma/client';

export interface ClientMetadata {
  client_name: string;
  logo_uri: string;
}

export interface CreateVerifier {
  verifierId: string;
  clientMetadata?: ClientMetadata;
}

export interface UpdateVerifier extends Omit<CreateVerifier, 'verifierId'> {
  publicVerifierId?: string;
}

export interface VerifierRecord {
  _tags: Record<string, unknown>;
  metadata: Record<string, unknown>;
  id: string;
  createdAt: string; // ISO timestamp
  verifierId: string;
  clientMetadata: {
    client_name: string;
    logo_uri: string;
  };
  updatedAt: string; // ISO timestamp
}

export enum OpenId4VcVerificationPresentationState {
  RequestCreated = 'RequestCreated',
  RequestUriRetrieved = 'RequestUriRetrieved',
  ResponseVerified = 'ResponseVerified',
  Error = 'Error'
}

/**
 * Request signer configuration for OID4VP verification presentations
 */
export interface IRequestSigner {
  method: SignerOption; // SignerOption enum value: 'DID', 'X509_P256', 'X509_ED25519',
  clientIdPrefix?: ClientIdPrefix;
}

/**
 * Presentation request interface - represents the structure expected by verification session creation
 */
export interface IPresentationRequest {
  requestSigner?: IRequestSigner;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  presentationExchange?: any; // PresentationExchangeDto
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dcql?: any; // DcqlDto
  responseMode: string; // ResponseMode enum
  expectedOrigins?: string[];
}
