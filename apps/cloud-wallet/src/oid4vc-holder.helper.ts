/* eslint-disable camelcase */
import { IRequestCredential } from '@credebl/common/interfaces/cloud-wallet.interface';
import {
  BindingChoiceError,
  BindingValidationError,
  CredentialBindingOptions,
  CredentialBindingPolicy,
  DID_URL_PATTERN,
  validateDidMethodAlgorithmPair
} from './oid4vc-holder-binding';

type RequestCredentialPayload = Omit<IRequestCredential, 'userId' | 'email'> & {
  binding?: CredentialBindingOptions;
};

function reject(code: string, message: string): never {
  throw new BindingChoiceError(message, [{ code, message }]);
}

function isPolicy(value: unknown): value is CredentialBindingPolicy {
  return 'require' === value || 'prefer' === value;
}

function rejectFirst(errors: BindingValidationError[]): void {
  if (0 < errors.length) {
    reject(errors[0].code, errors[0].message);
  }
}

function normalizeFreshKey(binding: CredentialBindingOptions, flatHolderDidUrl?: string): CredentialBindingOptions {
  if (flatHolderDidUrl || binding.holderDidUrl) {
    reject('CONFLICTING_HOLDER_DID_URL', 'A fresh key cannot be combined with a holder DID');
  }
  rejectFirst(validateDidMethodAlgorithmPair(binding.didMethod, binding.signatureAlgorithm));

  return {
    mode: 'new-key',
    ...(binding.didMethod ? { didMethod: binding.didMethod } : {}),
    ...(binding.signatureAlgorithm ? { signatureAlgorithm: binding.signatureAlgorithm } : {})
  };
}

function resolveHolderDidUrl(binding: CredentialBindingOptions, flatHolderDidUrl?: string): string {
  if (binding.holderDidUrl && flatHolderDidUrl && binding.holderDidUrl !== flatHolderDidUrl) {
    reject('CONFLICTING_HOLDER_DID_URL', 'Flat and nested holderDidUrl values disagree');
  }
  const holderDidUrl = binding.holderDidUrl ?? flatHolderDidUrl;
  if (!holderDidUrl) {
    reject('MISSING_HOLDER_DID_URL', 'existing-did requires a holder DID URL');
  }
  if (!DID_URL_PATTERN.test(holderDidUrl)) {
    reject('INVALID_HOLDER_DID_URL', 'holderDidUrl must be a DID or DID URL');
  }
  return holderDidUrl;
}

function resolvePolicy(policy: unknown): CredentialBindingPolicy {
  if (!isPolicy(policy)) {
    reject('INVALID_BINDING_POLICY', 'Policy must be require or prefer');
  }
  return policy;
}

function normalizeExistingDid(
  binding: CredentialBindingOptions,
  flatHolderDidUrl?: string,
  flatBindingPolicy?: CredentialBindingPolicy
): CredentialBindingOptions {
  if (binding.didMethod) {
    reject('UNSUPPORTED_DID_METHOD', 'didMethod is only valid for a fresh key');
  }
  if (binding.signatureAlgorithm) {
    reject('UNSUPPORTED_PROOF_ALGORITHM', 'signatureAlgorithm is only valid for a fresh key');
  }
  return {
    mode: 'existing-did',
    holderDidUrl: resolveHolderDidUrl(binding, flatHolderDidUrl),
    policy: resolvePolicy(binding.policy ?? flatBindingPolicy ?? 'require')
  };
}

function normalizeForwardedBinding(
  binding: CredentialBindingOptions,
  flatHolderDidUrl?: string,
  flatBindingPolicy?: CredentialBindingPolicy
): CredentialBindingOptions {
  if (!binding || 'object' !== typeof binding) {
    reject('INVALID_BINDING_MODE', 'binding must be an object');
  }
  if ('new-key' === binding.mode) {
    return normalizeFreshKey(binding, flatHolderDidUrl);
  }
  if ('existing-did' === binding.mode) {
    return normalizeExistingDid(binding, flatHolderDidUrl, flatBindingPolicy);
  }
  return reject('INVALID_BINDING_MODE', 'binding.mode must be new-key or existing-did');
}

/**
 * The nested `binding` object is additive and forwarded unchanged to the agent.
 * The old flat `holderDidUrl`/`bindingPolicy` fields keep working, but a flat DID is
 * dropped (with an error) for the fresh-key option so it can never be silently reused.
 */
export function withHolderBinding(payload: RequestCredentialPayload): RequestCredentialPayload {
  const { holderDidUrl, bindingPolicy, binding, ...rest } = payload;

  if (undefined === binding) {
    return holderDidUrl ? { ...rest, holderDidUrl, bindingPolicy: bindingPolicy ?? 'require' } : rest;
  }

  return { ...rest, binding: normalizeForwardedBinding(binding, holderDidUrl, bindingPolicy) };
}
