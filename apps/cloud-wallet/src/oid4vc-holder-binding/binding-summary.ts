/* eslint-disable camelcase */
import { HOLDER_BINDING_LABELS } from './binding.constants';
import { BindingConfirmationSummary, HolderBindingChoiceState } from './binding.types';

/** Confirmation shown before submit. Contains no tx code, proof JWT or key material. */
export function getBindingConfirmationSummary(state: HolderBindingChoiceState): BindingConfirmationSummary {
  if ('existing-did' === state.selectedMode) {
    const isSuggested = state.existingDid.holderDidUrl === state.existingDid.primaryDidUrl;
    return {
      modeLabel: HOLDER_BINDING_LABELS.existingDid,
      rows: [
        {
          label: HOLDER_BINDING_LABELS.bindingMode,
          value: HOLDER_BINDING_LABELS.existingDid
        },
        {
          label: HOLDER_BINDING_LABELS.holderDid,
          value: state.existingDid.holderDidUrl ?? '',
          ...(isSuggested ? { badge: HOLDER_BINDING_LABELS.primaryDidSuggestion } : {})
        },
        {
          label: HOLDER_BINDING_LABELS.policy,
          value: state.existingDid.policy
        }
      ]
    };
  }

  return {
    modeLabel: HOLDER_BINDING_LABELS.freshKey,
    rows: [
      { label: HOLDER_BINDING_LABELS.bindingMode, value: HOLDER_BINDING_LABELS.freshKey },
      {
        label: HOLDER_BINDING_LABELS.didMethod,
        value: state.freshKey.didMethod ?? HOLDER_BINDING_LABELS.automatic
      },
      {
        label: HOLDER_BINDING_LABELS.proofAlgorithm,
        value: state.freshKey.signatureAlgorithm ?? HOLDER_BINDING_LABELS.automatic
      }
    ]
  };
}
