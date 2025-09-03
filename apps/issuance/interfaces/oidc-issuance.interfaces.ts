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
  accessTokenSignerKeyType: string;
  display: Display[];
  dpopSigningAlgValuesSupported?: string[];
  credentialConfigurationsSupported?: Record<string, CredentialConfiguration>;
  authorizationServerConfigs: AuthorizationServerConfig;
}

export interface IAgentNatsPayload {
  url: string;
  apiKey?: string;
  orgId?: string;
}

export type IAgentOIDCIssuerCreate = IAgentNatsPayload & { issuerCreation: IssuerCreation };
