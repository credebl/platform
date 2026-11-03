export interface Oid4vcCredentialOfferWebhookPayload {
  oidcIssueCredentialDto: Oid4vcCredentialOfferWebhookDto;
  id: string;
}

export interface Oid4vcCredentialOfferWebhookDto {
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
  issuerId?: string;
  notification?: Oid4vciWalletNotification;
  notifications?: Oid4vciSessionNotification[];
}

export type Oid4vciNotificationEvent = 'credential_accepted' | 'credential_failure' | 'credential_deleted';

export interface Oid4vciWalletNotification {
  notificationId: string;
  credentialConfigurationId?: string;
  event: Oid4vciNotificationEvent;
  eventDescription?: string;
  receivedAt: string;
}

export interface Oid4vciSessionNotification {
  notificationId: string;
  credentialConfigurationId?: string;
  events: Omit<Oid4vciWalletNotification, 'notificationId' | 'credentialConfigurationId'>[];
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

export interface OidcIssueCredentialPayload {
  oidcIssueCredentialDto: {
    id: string;
    credentialOfferId?: string;
    state?: string;
    contextCorrelationId?: string;
    credentialConfigurationIds?: string[];
    issuedCredentials?: string[];
    issuerId?: string;
    credentialOfferPayload?: {
      credential_issuer?: string;
      credential_configuration_ids?: string[];
      grants?: Record<string, unknown>;
      credentials?: string[];
    };
  };
}
