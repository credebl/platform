/* eslint-disable camelcase */
import { algorithmsForDidMethod } from './binding-capabilities';
import { HOLDER_BINDING_LABELS, HOLDER_BINDING_OPTION_ORDER } from './binding.constants';
import {
  BindingOption,
  CredentialBindingPolicy,
  HolderBindingCapabilities,
  HolderBindingChoiceState
} from './binding.types';

export interface CreateBindingChoiceInput {
  capabilities: HolderBindingCapabilities;
  holderDids?: readonly string[];
  /** Already fetched from the platform endpoint; only used inside the existing-DID option. */
  primaryDidUrl?: string;
}

/** Fresh key is always the selected option, even when a platform primary DID exists. */
export function createHolderBindingChoice(input: CreateBindingChoiceInput): HolderBindingChoiceState {
  const holderDids = [...(input.holderDids ?? [])];
  return {
    selectedMode: HOLDER_BINDING_OPTION_ORDER[0],
    freshKey: {},
    existingDid: {
      holderDidUrl: input.primaryDidUrl && holderDids.includes(input.primaryDidUrl) ? input.primaryDidUrl : undefined,
      policy: 'require',
      primaryDidUrl: input.primaryDidUrl && holderDids.includes(input.primaryDidUrl) ? input.primaryDidUrl : undefined
    },
    holderDids,
    validationPending: false
  };
}

/** Render both options in the studio/cloud-wallet order: fresh key first, existing DID second. */
export function renderBindingOptions(
  state: HolderBindingChoiceState,
  capabilities: HolderBindingCapabilities
): BindingOption[] {
  const optionsByMode: Record<string, BindingOption> = {
    'new-key': {
      mode: 'new-key',
      label: HOLDER_BINDING_LABELS.freshKey,
      selected: 'new-key' === state.selectedMode,
      advanced: {
        label: HOLDER_BINDING_LABELS.advanced,
        didMethods: [...capabilities.didMethods],
        signatureAlgorithms: algorithmsForDidMethod(state.freshKey.didMethod, capabilities.signatureAlgorithms)
      }
    },
    'existing-did': {
      mode: 'existing-did',
      label: HOLDER_BINDING_LABELS.existingDid,
      selected: 'existing-did' === state.selectedMode,
      policy: { label: HOLDER_BINDING_LABELS.policy, value: state.existingDid.policy },
      dids: state.holderDids.map((didUrl) => ({
        didUrl,
        selected: didUrl === state.existingDid.holderDidUrl,
        ...(didUrl === state.existingDid.primaryDidUrl ? { badge: HOLDER_BINDING_LABELS.primaryDidSuggestion } : {})
      }))
    }
  };

  return HOLDER_BINDING_OPTION_ORDER.map((mode) => optionsByMode[mode]);
}

export function selectFreshKey(
  state: HolderBindingChoiceState,
  overrides: { didMethod?: string; signatureAlgorithm?: string } = {}
): HolderBindingChoiceState {
  return {
    ...state,
    selectedMode: 'new-key',
    freshKey: {
      didMethod: overrides.didMethod ?? state.freshKey.didMethod,
      signatureAlgorithm: overrides.signatureAlgorithm ?? state.freshKey.signatureAlgorithm
    }
  };
}

export function selectExistingDid(
  state: HolderBindingChoiceState,
  holderDidUrl: string,
  policy: CredentialBindingPolicy = 'require'
): HolderBindingChoiceState {
  return {
    ...state,
    selectedMode: 'existing-did',
    existingDid: {
      ...state.existingDid,
      holderDidUrl,
      policy
    }
  };
}

export function setBindingValidationPending(
  state: HolderBindingChoiceState,
  validationPending: boolean
): HolderBindingChoiceState {
  return { ...state, validationPending };
}
