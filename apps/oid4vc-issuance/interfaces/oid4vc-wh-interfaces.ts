export interface Oid4vcCredentialOfferWebhookPayload {
  id: string;
  credentialOfferId?: string;
  issuedCredentials?: Record<string, unknown>[];
  createdAt?: string;
  updatedAt?: string;
  credentialOfferPayload?: {
    credential_configuration_ids?: string[];
  };
  state?: string;
  contextCorrelationId?: string;
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
