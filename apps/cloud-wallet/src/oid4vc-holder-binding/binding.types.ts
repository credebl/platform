/* eslint-disable camelcase */

/**
 * The additive `binding` contract shared with agent-controller and the platform API.
 * Kept local to the cloud-wallet app so the app can be changed without touching shared interfaces.
 */
export type CredentialBindingMode = 'new-key' | 'existing-did';
export type CredentialBindingPolicy = 'require' | 'prefer';

export interface CredentialBindingOptions {
  mode: CredentialBindingMode;
  holderDidUrl?: string;
  policy?: CredentialBindingPolicy;
  didMethod?: string;
  signatureAlgorithm?: string;
}

/** Metadata advertised by the issuer for a credential configuration in a resolved offer. */
export interface CredentialConfigurationMetadata {
  format?: string;
  cryptographic_binding_methods_supported?: string[];
  cryptographicBindingMethodsSupported?: string[];
  proof_types_supported?: {
    jwt?: { proof_signing_alg_values_supported?: string[] };
    [proofType: string]: { proof_signing_alg_values_supported?: string[] } | undefined;
  };
}

export interface ResolvedOfferMetadata {
  credential_configurations_supported?: Record<string, CredentialConfigurationMetadata>;
  credentialConfigurationsSupported?: Record<string, CredentialConfigurationMetadata>;
  supportsAllDidMethods?: boolean;
  supports_all_did_methods?: boolean;
}

/** Wallet capabilities (resolvers, registrars and KMS key types) used to narrow issuer metadata. */
export interface WalletBindingCapabilitiesInput {
  didMethods?: readonly string[];
  signatureAlgorithms?: readonly string[];
  proofSigningAlgValuesSupported?: readonly string[];
  kmsAlgorithms?: readonly string[];
}

/** The lists actually shown in the advanced controls. They are already intersected with issuer metadata. */
export interface HolderBindingCapabilities {
  didMethods: string[];
  signatureAlgorithms: string[];
  credentialFormats: string[];
}

/** Platform preference from `GET /orgs/:orgId/users/:userId/oid4vc/holder/primary-did`. */
export interface PrimaryDidPreference {
  didUrl: string;
  holderTenantId?: string;
}

/** Framework-agnostic state for one offer's binding choice. */
export interface HolderBindingChoiceState {
  /** A string so that an unsupported mode can be reported as `INVALID_BINDING_MODE`. */
  selectedMode: string;
  freshKey: {
    didMethod?: string;
    signatureAlgorithm?: string;
    holderDidUrl?: string;
  };
  existingDid: {
    holderDidUrl?: string;
    policy: CredentialBindingPolicy;
    /** The platform suggestion is stored here only; it never leaks into the fresh-key branch. */
    primaryDidUrl?: string;
    didMethod?: string;
    signatureAlgorithm?: string;
  };
  holderDids: string[];
  /** Submit must stay disabled until asynchronous validation settles. */
  validationPending: boolean;
}

export interface HolderDidOption {
  didUrl: string;
  selected: boolean;
  badge?: 'suggested';
}

export interface BindingOption {
  mode: CredentialBindingMode;
  label: string;
  selected: boolean;
  advanced?: {
    label: string;
    didMethods: string[];
    signatureAlgorithms: string[];
  };
  policy?: { label: string; value: CredentialBindingPolicy };
  dids?: HolderDidOption[];
}

export interface BindingValidationError {
  code: string;
  message: string;
}

export interface BindingValidationResult {
  valid: boolean;
  canSubmit: boolean;
  errors: BindingValidationError[];
}

export interface BindingSummaryRow {
  label: string;
  value: string;
  badge?: 'suggested';
}

export interface BindingConfirmationSummary {
  modeLabel: string;
  rows: BindingSummaryRow[];
}
