export interface Claim {
  key: string;
  label: string;
  required: boolean;
}

export interface Logo {
  uri: string;
  alt_text: string;
}

export interface Display {
  locale: string;
  name: string;
  description?: string;
  logo?: Logo;
}

export interface CredentialConfiguration {
  format: string;
  vct?: string;
  doctype?: string;
  scope: string;
  claims: Record<string, Claim>;
  credential_signing_alg_values_supported: string[];
  cryptographic_binding_methods_supported: string[];
  display: Display[];
}

export interface ClientAuthentication {
  clientId: string;
  clientSecret: string;
}

export interface AuthorizationServerConfig {
  issuer: string;
  clientAuthentication: ClientAuthentication;
}

export interface IssuerCreation {
  issuerId: string;
  accessTokenSignerKeyType: AccessTokenSignerKeyType;
  display: Display[];
  dpopSigningAlgValuesSupported?: string[];
  credentialConfigurationsSupported?: Record<string, CredentialConfiguration>;
  authorizationServerConfigs: AuthorizationServerConfig;
  batchCredentialIssuanceSize: number;
}

export interface IssuerInitialConfig {
  issuerId: string;
  // eslint-disable-next-line @typescript-eslint/ban-types
  display: Display[] | {};
  // eslint-disable-next-line @typescript-eslint/ban-types
  authorizationServerConfigs: AuthorizationServerConfig | {};
  accessTokenSignerKeyType: AccessTokenSignerKeyType;
  dpopSigningAlgValuesSupported: string[];
  batchCredentialIssuance: object;
  credentialConfigurationsSupported: object;
}

export interface IssuerMetadata {
  publicIssuerId: string;
  createdById: string;
  orgAgentId: string;
  batchCredentialIssuanceSize?: number;
}

export interface initialIssuerDetails {
  metadata: Display[];
  publicIssuerId: string;
}

export enum AccessTokenSignerKeyType {
  ED25519 = 'ed25519'
}

export interface IssuerUpdation {
  issuerId: string;
  accessTokenSignerKeyType: AccessTokenSignerKeyType;
  display;
  batchCredentialIssuanceSize?: number;
}

export interface IAgentNatsPayload {
  url: string;
  apiKey?: string;
  orgId?: string;
}

export type IAgentOIDCIssuerCreate = IAgentNatsPayload & { issuerCreation: IssuerCreation };
