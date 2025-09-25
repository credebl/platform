export interface CredentialOfferPayload {
  credential_issuer: string;
  credential_configuration_ids: string[];
  grants: Record<string, unknown>;
  credentials: Record<string, unknown>[];
}

export interface IssuanceMetadata {
  issuerDid: string;
  credentials: Record<string, unknown>[];
}

export interface OidcIssueCredential {
  _tags: Record<string, unknown>;
  metadata: Record<string, unknown>;
  issuedCredentials: Record<string, unknown>[];
  id: string;
  createdAt: string; // ISO date string
  issuerId: string;
  userPin: string;
  preAuthorizedCode: string;
  credentialOfferUri: string;
  credentialOfferId: string;
  credentialOfferPayload: CredentialOfferPayload;
  issuanceMetadata: IssuanceMetadata;
  state: string;
  updatedAt: string; // ISO date string
  contextCorrelationId: string;
}

export interface CredentialOfferWebhookPayload {
  credentialOfferId: string;
  id: string;
  State: string;
  contextCorrelationId: string;
}

export interface CredentialPayload {
  orgId: string;
  schemaId?: string;
  connectionId?: string;
  credDefid?: string;
  threadId: string;
  createdBy: string;
  lastChangedBy: string;
  state: string;
  credentialExchangeId: string;
}
