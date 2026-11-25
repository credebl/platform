/**
 * Labels and ordering agreed with the studio redemption UI. The fresh-key option must stay
 * first and selected by default; the primary DID badge is only ever a "suggested" hint.
 */
export const HOLDER_BINDING_LABELS = {
  freshKey: 'Use a fresh key — recommended',
  existingDid: 'Use an existing DID',
  advanced: 'Advanced',
  policy: 'Policy',
  didMethod: 'DID method',
  proofAlgorithm: 'Proof algorithm',
  holderDid: 'Holder DID',
  bindingMode: 'Binding mode',
  automatic: 'Automatic',
  primaryDidSuggestion: 'suggested'
} as const;

export const HOLDER_BINDING_OPTION_ORDER = ['new-key', 'existing-did'] as const;

/** Wallet-implicit preference for newly created keys (spec 6.2). */
export const PREFERRED_SIGNATURE_ALGORITHMS = ['EdDSA', 'ES256', 'ES384', 'ES512', 'RS256', 'PS256'] as const;

/** `did:jwk` is preferred over `did:key` when the issuer advertises all methods (spec 6.2). */
export const PREFERRED_DID_METHODS = ['did:jwk', 'did:key'] as const;

/** Key types that cannot be created by every registered KMS backend (Askar has no RSA). */
export const RSA_SIGNATURE_ALGORITHMS = ['RS256', 'PS256', 'RS384', 'PS384', 'RS512', 'PS512'] as const;

/** DID URL shape used by the platform DTO; deliberately permissive about DID-specific characters. */
export const DID_URL_PATTERN = /^did:[a-z0-9]+:\S+$/i;
