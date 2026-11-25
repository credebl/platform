/* eslint-disable camelcase */
import { CredentialBindingOptions, HolderBindingCapabilities, HolderBindingChoiceState } from './binding.types';
import { BindingChoiceError, validateBindingChoice } from './binding-validation';

export interface BindingRequestPayload {
  binding: CredentialBindingOptions;
}

/**
 * Build the additive, nested `binding` field for the platform/agent request.
 * A fresh key never carries a flat or nested `holderDidUrl`; existing-DID fields are
 * only sent when the holder explicitly opted in to that option.
 */
export function buildBindingRequestPayload(
  state: HolderBindingChoiceState,
  capabilities: HolderBindingCapabilities
): BindingRequestPayload {
  const validation = validateBindingChoice(state, capabilities);
  if (!validation.valid) {
    throw new BindingChoiceError('Invalid holder binding choice', validation.errors);
  }

  if ('existing-did' === state.selectedMode) {
    return {
      binding: {
        mode: 'existing-did',
        holderDidUrl: state.existingDid.holderDidUrl as string,
        policy: state.existingDid.policy
      }
    };
  }

  const { freshKey } = state;
  return {
    binding: {
      mode: 'new-key',
      ...(freshKey.didMethod ? { didMethod: freshKey.didMethod } : {}),
      ...(freshKey.signatureAlgorithm ? { signatureAlgorithm: freshKey.signatureAlgorithm } : {})
    }
  };
}

/** Used by the service to convert validation failures to a stable HTTP 400. */
export function bindingErrorFromState(
  state: HolderBindingChoiceState,
  capabilities: HolderBindingCapabilities
): BindingChoiceError | null {
  const validation = validateBindingChoice(state, capabilities);
  return validation.valid ? null : new BindingChoiceError('Invalid holder binding choice', validation.errors);
}
