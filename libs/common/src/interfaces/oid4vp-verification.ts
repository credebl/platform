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

export enum OpenId4VcVerificationSessionState {
  RequestCreated = "RequestCreated",
  RequestUriRetrieved = "RequestUriRetrieved",
  ResponseVerified = "ResponseVerified",
  Error = "Error",
}
