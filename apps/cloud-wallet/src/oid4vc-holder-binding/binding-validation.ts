/* eslint-disable camelcase */
import { isDidMethodSupported, isSignatureAlgorithmSupported } from './binding-capabilities';
import { DID_URL_PATTERN, RSA_SIGNATURE_ALGORITHMS } from './binding.constants';
import {
  BindingValidationError,
  BindingValidationResult,
  HolderBindingCapabilities,
  HolderBindingChoiceState
} from './binding.types';

/** Raised when a caller tries to submit a selection that would be rejected by the agent. */
export class BindingChoiceError extends Error {
  constructor(
    message: string,
    public readonly errors: BindingValidationError[]
  ) {
    super(message);
    this.name = 'BindingChoiceError';
  }

  get codes(): string[] {
    return this.errors.map((error) => error.code);
  }
}

function error(code: string, message: string): BindingValidationError {
  return { code, message };
}

function isRsaAlgorithm(algorithm: string): boolean {
  return (RSA_SIGNATURE_ALGORITHMS as readonly string[]).includes(algorithm);
}

/** Shared by the UI validator and the request-path helper so both reject the same invalid pair. */
export function validateDidMethodAlgorithmPair(
  didMethod?: string,
  signatureAlgorithm?: string
): BindingValidationError[] {
  if (didMethod && signatureAlgorithm && 'did:key' === didMethod && isRsaAlgorithm(signatureAlgorithm)) {
    return [error('INCOMPATIBLE_DID_METHOD_AND_ALGORITHM', 'did:key cannot use an RSA proof algorithm')];
  }
  return [];
}

function validateExistingDid(
  state: HolderBindingChoiceState,
  capabilities: HolderBindingCapabilities
): BindingValidationError[] {
  const errors: BindingValidationError[] = [];
  const { existingDid } = state;

  if (capabilities.credentialFormats.includes('mso_mdoc')) {
    errors.push(error('DID_BINDING_NOT_SUPPORTED_FOR_FORMAT', 'mso_mdoc cannot be bound to an existing DID'));
  }
  if (undefined === existingDid.holderDidUrl || '' === existingDid.holderDidUrl) {
    errors.push(error('MISSING_HOLDER_DID_URL', 'Select a holder DID to use an existing DID'));
  } else if (!DID_URL_PATTERN.test(existingDid.holderDidUrl)) {
    errors.push(error('INVALID_HOLDER_DID_URL', 'Holder DID must be a DID or DID URL'));
  } else if (!state.holderDids.includes(existingDid.holderDidUrl)) {
    errors.push(
      existingDid.holderDidUrl === existingDid.primaryDidUrl
        ? error('PRIMARY_DID_NOT_FOUND', 'The suggested primary DID is not in the holder tenant')
        : error('DID_NOT_CONTROLLED_BY_HOLDER_TENANT', 'The DID is not controlled by the holder tenant')
    );
  }
  if ('require' !== existingDid.policy && 'prefer' !== existingDid.policy) {
    errors.push(error('INVALID_BINDING_POLICY', 'Policy must be require or prefer'));
  }
  if (existingDid.didMethod || existingDid.signatureAlgorithm) {
    errors.push(
      error('UNSUPPORTED_DID_METHOD', 'DID method and proof algorithm overrides are only valid with a fresh key')
    );
  }

  return errors;
}

function validateFreshKey(
  state: HolderBindingChoiceState,
  capabilities: HolderBindingCapabilities
): BindingValidationError[] {
  const errors: BindingValidationError[] = [];
  const { freshKey } = state;

  if (freshKey.holderDidUrl) {
    errors.push(error('CONFLICTING_HOLDER_DID_URL', 'A fresh key cannot be combined with a holder DID'));
  }
  if (0 === capabilities.didMethods.length) {
    errors.push(error('UNSUPPORTED_DID_METHOD', 'No DID method is compatible with this offer'));
  }
  if (0 === capabilities.signatureAlgorithms.length) {
    errors.push(error('UNSUPPORTED_PROOF_ALGORITHM', 'No proof algorithm is compatible with this offer'));
  }
  if (freshKey.didMethod && !isDidMethodSupported(capabilities, freshKey.didMethod)) {
    errors.push(error('UNSUPPORTED_DID_METHOD', 'The selected DID method is not supported by this offer'));
  }
  if (freshKey.signatureAlgorithm && !isSignatureAlgorithmSupported(capabilities, freshKey.signatureAlgorithm)) {
    errors.push(error('UNSUPPORTED_PROOF_ALGORITHM', 'The selected proof algorithm is not supported by this offer'));
  }
  errors.push(...validateDidMethodAlgorithmPair(freshKey.didMethod, freshKey.signatureAlgorithm));
  if (capabilities.credentialFormats.includes('ldp_vc')) {
    const effectiveMethod = freshKey.didMethod ?? capabilities.didMethods[0];
    if ('jwk' === effectiveMethod || !capabilities.didMethods.some((method) => method.startsWith('did:'))) {
      errors.push(error('DID_BINDING_NOT_SUPPORTED_FOR_FORMAT', 'ldp_vc requires a DID method, not a plain JWK'));
    }
  }

  return errors;
}

/**
 * Validate the whole choice before token redemption. `canSubmit` is false while validation is
 * pending, so the UI can keep the submit button disabled (P-UI-08).
 */
export function validateBindingChoice(
  state: HolderBindingChoiceState,
  capabilities: HolderBindingCapabilities
): BindingValidationResult {
  let errors: BindingValidationError[] = [];

  if (state.validationPending) {
    errors = [error('VALIDATION_PENDING', 'Binding validation is still in progress')];
  } else if ('new-key' !== state.selectedMode && 'existing-did' !== state.selectedMode) {
    errors = [error('INVALID_BINDING_MODE', 'Binding mode must be new-key or existing-did')];
  } else if ('existing-did' === state.selectedMode) {
    errors = validateExistingDid(state, capabilities);
  } else {
    errors = validateFreshKey(state, capabilities);
  }

  return { valid: 0 === errors.length, canSubmit: 0 === errors.length, errors };
}
