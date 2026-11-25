/* eslint-disable camelcase, @typescript-eslint/explicit-function-return-type */
import { deriveBindingCapabilities, algorithmsForDidMethod } from './binding-capabilities';
import {
  createHolderBindingChoice,
  renderBindingOptions,
  selectExistingDid,
  selectFreshKey,
  setBindingValidationPending
} from './binding-choice';
import { HOLDER_BINDING_LABELS, HOLDER_BINDING_OPTION_ORDER } from './binding.constants';
import {
  buildBindingRequestPayload,
  BindingChoiceError,
  getBindingConfirmationSummary,
  normalizePrimaryDidResponse,
  suggestPrimaryDid,
  validateBindingChoice
} from './index';
import { fetchPrimaryDidPreference } from './primary-did-preference';
import { HolderBindingCapabilities, HolderBindingChoiceState } from './binding.types';
import { withHolderBinding } from '../oid4vc-holder.helper';

const PRIMARY_DID = 'did:web:holder.example.com#key-1';
const SECOND_DID = 'did:key:z6MkExampleHolderKey#key-1';

function capabilities(overrides: Partial<HolderBindingCapabilities> = {}): HolderBindingCapabilities {
  return {
    didMethods: ['did:jwk', 'did:key', 'did:web', 'jwk'],
    signatureAlgorithms: ['EdDSA', 'ES256', 'RS256'],
    credentialFormats: ['dc+sd-jwt'],
    ...overrides
  };
}

function choice(
  overrides: {
    primaryDid?: string;
    holderDids?: string[];
    capabilities?: HolderBindingCapabilities;
  } = {}
): { state: HolderBindingChoiceState; caps: HolderBindingCapabilities } {
  const caps = overrides.capabilities ?? capabilities();
  return {
    caps,
    state: createHolderBindingChoice({
      capabilities: caps,
      holderDids: overrides.holderDids ?? [PRIMARY_DID, SECOND_DID],
      primaryDidUrl: overrides.primaryDid
    })
  };
}

describe('holder binding choice labels and ordering (P-UI-07)', () => {
  it('renders fresh key first, existing DID second, with advanced controls on the fresh-key option', () => {
    const { state, caps } = choice();
    const options = renderBindingOptions(state, caps);

    expect(options.map((option) => option.mode)).toEqual(['new-key', 'existing-did']);
    expect(options[0].label).toBe('Use a fresh key — recommended');
    expect(options[1].label).toBe('Use an existing DID');
    expect(options[0].advanced?.label).toBe('Advanced');
    expect(options[1].advanced).toBeUndefined();
    expect(HOLDER_BINDING_OPTION_ORDER).toEqual(['new-key', 'existing-did']);
  });
});

describe('fresh key default and primary DID suggestion', () => {
  it('keeps fresh key selected by default even when the platform primary DID exists (P-UI-04)', () => {
    const { state, caps } = choice({ primaryDid: PRIMARY_DID });
    const [fresh, existing] = renderBindingOptions(state, caps);

    expect(state.selectedMode).toBe('new-key');
    expect(fresh.selected).toBe(true);
    expect(existing.selected).toBe(false);
    expect(existing.dids?.find((did) => did.didUrl === PRIMARY_DID)?.selected).toBe(true);
  });

  it('only labels the primary DID "suggested" inside the existing-DID option (N-P-03)', () => {
    const { state, caps } = choice({ primaryDid: PRIMARY_DID });
    const [fresh, existing] = renderBindingOptions(state, caps);
    const primary = existing.dids?.find((did) => did.didUrl === PRIMARY_DID);

    expect(primary?.badge).toBe('suggested');
    expect(existing.policy?.value).toBe('require');
    expect(JSON.stringify(fresh)).not.toContain('suggested');
    expect(JSON.stringify(existing.dids)).not.toContain('"badge":"default"');
    expect(JSON.stringify(existing.dids)).not.toContain('"badge":"required"');
    expect(HOLDER_BINDING_LABELS.primaryDidSuggestion).toBe('suggested');
  });

  it('does not preselect a primary DID that is not in the holder tenant', () => {
    const { state, caps } = choice({ primaryDid: 'did:web:elsewhere.example#key-1' });

    expect(state.existingDid.primaryDidUrl).toBeUndefined();
    expect(renderBindingOptions(state, caps)[1].dids?.some((did) => 'suggested' === did.badge)).toBe(false);
  });
});

describe('advanced controls from issuer metadata and wallet capabilities (P-UI-05)', () => {
  const offer = {
    credential_configurations_supported: {
      person: {
        format: 'dc+sd-jwt',
        cryptographic_binding_methods_supported: ['did:key', 'did:jwk', 'did:web', 'did:polygon'],
        proof_types_supported: { jwt: { proof_signing_alg_values_supported: ['ES256', 'EdDSA', 'RS256'] } }
      }
    }
  };

  it('shows only methods and algorithms allowed by both the issuer and the wallet', () => {
    const caps = deriveBindingCapabilities(offer, {
      didMethods: ['did:key', 'did:jwk', 'did:web'],
      signatureAlgorithms: ['EdDSA', 'ES256']
    });

    expect(caps.didMethods).toEqual(['did:jwk', 'did:key', 'did:web']);
    expect(caps.signatureAlgorithms).toEqual(['EdDSA', 'ES256']);
    const { state } = choice({ capabilities: caps });
    expect(renderBindingOptions(state, caps)[0].advanced?.didMethods).toEqual(caps.didMethods);
    expect(renderBindingOptions(state, caps)[0].advanced?.signatureAlgorithms).toEqual(caps.signatureAlgorithms);
  });

  it('supportsAllDidMethods falls back to wallet methods, preferring did:jwk', () => {
    const caps = deriveBindingCapabilities({ supportsAllDidMethods: true }, { didMethods: ['did:key', 'did:jwk'] });

    expect(caps.didMethods).toEqual(['did:jwk', 'did:key']);
  });

  it('uses preferred wallet algorithms when the issuer advertises none', () => {
    const caps = deriveBindingCapabilities(undefined, { signatureAlgorithms: ['RS256', 'EdDSA', 'ES256'] });

    expect(caps.signatureAlgorithms).toEqual(['EdDSA', 'ES256', 'RS256']);
  });

  it('hides RSA algorithms once did:key is selected', () => {
    expect(algorithmsForDidMethod('did:key', ['EdDSA', 'ES256', 'RS256'])).toEqual(['EdDSA', 'ES256']);
    expect(algorithmsForDidMethod('did:jwk', ['EdDSA', 'ES256', 'RS256'])).toEqual(['EdDSA', 'ES256', 'RS256']);
  });

  it('removes plain JWK from advanced controls for ldp_vc', () => {
    const caps = deriveBindingCapabilities(
      {
        credential_configurations_supported: {
          w3c: { format: 'ldp_vc', cryptographic_binding_methods_supported: ['jwk', 'did:key'] }
        }
      },
      { didMethods: ['jwk', 'did:key'] }
    );

    expect(caps.didMethods).toEqual(['did:key']);
  });

  it('keeps an explicitly unsupported wallet DID list empty', () => {
    const caps = deriveBindingCapabilities(undefined, { didMethods: ['did:example'] });

    expect(caps.didMethods).toEqual([]);
  });

  it('does not fall back to wallet methods when issuer configurations are disjoint', () => {
    const caps = deriveBindingCapabilities(
      {
        credential_configurations_supported: {
          a: { cryptographic_binding_methods_supported: ['did:key'] },
          b: { cryptographic_binding_methods_supported: ['did:jwk'] }
        }
      },
      { didMethods: ['did:key', 'did:jwk'] }
    );

    expect(caps.didMethods).toEqual([]);
  });

  it('restricts wallet algorithms to the algorithms the KMS can create', () => {
    const caps = deriveBindingCapabilities(undefined, {
      signatureAlgorithms: ['EdDSA', 'ES256'],
      kmsAlgorithms: ['EdDSA']
    });

    expect(caps.signatureAlgorithms).toEqual(['EdDSA']);
  });

  it('does not reintroduce preferred algorithms when the KMS supports none', () => {
    const caps = deriveBindingCapabilities(undefined, {
      signatureAlgorithms: ['EdDSA', 'ES256'],
      kmsAlgorithms: []
    });

    expect(caps.signatureAlgorithms).toEqual([]);
  });

  it('does not fall back to wallet algorithms when issuer configurations are disjoint', () => {
    const caps = deriveBindingCapabilities(
      {
        credential_configurations_supported: {
          a: { proof_types_supported: { jwt: { proof_signing_alg_values_supported: ['ES256'] } } },
          b: { proof_types_supported: { jwt: { proof_signing_alg_values_supported: ['EdDSA'] } } }
        }
      },
      { signatureAlgorithms: ['EdDSA', 'ES256'] }
    );

    expect(caps.signatureAlgorithms).toEqual([]);
  });
});

describe('confirmation summary before submit (P-UI-06)', () => {
  it('summarizes the selected fresh-key method and algorithm', () => {
    const { state } = choice();
    const selected = selectFreshKey(state, { didMethod: 'did:jwk', signatureAlgorithm: 'ES256' });
    const summary = getBindingConfirmationSummary(selected);

    expect(summary.modeLabel).toBe('Use a fresh key — recommended');
    expect(summary.rows).toEqual([
      { label: 'Binding mode', value: 'Use a fresh key — recommended' },
      { label: 'DID method', value: 'did:jwk' },
      { label: 'Proof algorithm', value: 'ES256' }
    ]);
  });

  it('summarizes the suggested existing DID without a required badge', () => {
    const { state } = choice({ primaryDid: PRIMARY_DID });
    const summary = getBindingConfirmationSummary(selectExistingDid(state, PRIMARY_DID));

    expect(summary.modeLabel).toBe('Use an existing DID');
    expect(summary.rows.find((row) => 'Holder DID' === row.label)).toEqual({
      label: 'Holder DID',
      value: PRIMARY_DID,
      badge: 'suggested'
    });
    expect(summary.rows.find((row) => 'Policy' === row.label)?.value).toBe('require');
  });
});

describe('submit gating (P-UI-08)', () => {
  it('disables submit while validation is pending', () => {
    const { state, caps } = choice();
    const pending = setBindingValidationPending(state, true);
    const result = validateBindingChoice(pending, caps);

    expect(result.canSubmit).toBe(false);
    expect(result.errors[0].code).toBe('VALIDATION_PENDING');
    expect(() => buildBindingRequestPayload(pending, caps)).toThrow(BindingChoiceError);
  });

  it('disables submit for an unsupported selection and reports the stable error code', () => {
    const { state, caps } = choice();
    const selected = selectFreshKey(state, { didMethod: 'did:polygon', signatureAlgorithm: 'ES256' });
    const result = validateBindingChoice(selected, caps);

    expect(result.valid).toBe(false);
    expect(result.canSubmit).toBe(false);
    expect(result.errors.map((error) => error.code)).toContain('UNSUPPORTED_DID_METHOD');
  });
});

describe('fresh key submits no holder DID (P-FK-16, N-P-01)', () => {
  it('omits flat and nested holderDidUrl even when a primary DID suggestion exists', () => {
    const { state, caps } = choice({ primaryDid: PRIMARY_DID });
    const payload = buildBindingRequestPayload(state, caps);
    const request = withHolderBinding({
      credentialOfferUri: 'openid-credential-offer://?credential_offer_uri=x',
      credentialsToRequest: ['Person'],
      ...payload
    });

    expect(payload).toEqual({ binding: { mode: 'new-key' } });
    expect(request).not.toHaveProperty('holderDidUrl');
    expect(JSON.stringify(request)).not.toContain(PRIMARY_DID);
  });

  it('forwards advanced options as nested fresh-key fields', () => {
    const { state, caps } = choice();
    const selected = selectFreshKey(state, { didMethod: 'did:key', signatureAlgorithm: 'EdDSA' });

    expect(buildBindingRequestPayload(selected, caps)).toEqual({
      binding: { mode: 'new-key', didMethod: 'did:key', signatureAlgorithm: 'EdDSA' }
    });
  });
});

describe('existing DID opt-in (P-ED-11)', () => {
  it('sends the suggested primary DID as a nested holderDidUrl with a require policy', () => {
    const { state, caps } = choice({ primaryDid: PRIMARY_DID });
    const selected = selectExistingDid(state, PRIMARY_DID);
    const payload = buildBindingRequestPayload(selected, caps);
    const request = withHolderBinding({
      credentialOfferUri: 'openid-credential-offer://?credential_offer_uri=x',
      credentialsToRequest: ['Person'],
      ...payload
    });

    expect(payload).toEqual({
      binding: { mode: 'existing-did', holderDidUrl: PRIMARY_DID, policy: 'require' }
    });
    expect(request.binding).toEqual(payload.binding);
    expect(request).not.toHaveProperty('holderDidUrl');
  });

  it('keeps an explicit prefer policy', () => {
    const { state, caps } = choice({ primaryDid: PRIMARY_DID });
    const payload = buildBindingRequestPayload(selectExistingDid(state, SECOND_DID, 'prefer'), caps);

    expect(payload.binding).toEqual({ mode: 'existing-did', holderDidUrl: SECOND_DID, policy: 'prefer' });
  });
});

describe('validation negatives (N-V)', () => {
  it('rejects an unknown binding mode (N-V-01)', () => {
    const { state, caps } = choice();
    const result = validateBindingChoice({ ...state, selectedMode: 'bogus' }, caps);

    expect(result.errors[0].code).toBe('INVALID_BINDING_MODE');
  });

  it('requires a holderDidUrl in existing-did mode (N-V-02)', () => {
    const { state, caps } = choice();
    const result = validateBindingChoice(selectExistingDid(state, ''), caps);

    expect(result.errors.map((error) => error.code)).toContain('MISSING_HOLDER_DID_URL');
  });

  it('rejects conflicting flat and nested holderDidUrl values (N-V-03)', () => {
    const payload = {
      credentialOfferUri: 'offer',
      credentialsToRequest: ['Person'],
      holderDidUrl: PRIMARY_DID,
      binding: { mode: 'existing-did' as const, holderDidUrl: SECOND_DID }
    };

    expect(() => withHolderBinding(payload)).toThrow(
      expect.objectContaining({ codes: ['CONFLICTING_HOLDER_DID_URL'] })
    );
  });

  it('rejects fresh-key overrides in existing-did mode (N-V-04, N-V-05)', () => {
    const { state, caps } = choice();
    const selected = selectExistingDid(state, PRIMARY_DID);
    const result = validateBindingChoice(
      {
        ...selected,
        existingDid: { ...selected.existingDid, didMethod: 'did:key', signatureAlgorithm: 'ES256' }
      },
      caps
    );

    expect(result.errors.map((error) => error.code)).toContain('UNSUPPORTED_DID_METHOD');
    const payload = {
      credentialOfferUri: 'offer',
      credentialsToRequest: ['Person'],
      binding: { mode: 'existing-did' as const, holderDidUrl: PRIMARY_DID, didMethod: 'did:key' }
    };

    expect(() => withHolderBinding(payload)).toThrow(expect.objectContaining({ codes: ['UNSUPPORTED_DID_METHOD'] }));
  });

  it('rejects a flat holder DID in fresh-key mode (N-V-06)', () => {
    const payload = {
      credentialOfferUri: 'offer',
      credentialsToRequest: ['Person'],
      holderDidUrl: PRIMARY_DID,
      binding: { mode: 'new-key' as const }
    };

    expect(() => withHolderBinding(payload)).toThrow(
      expect.objectContaining({ codes: ['CONFLICTING_HOLDER_DID_URL'] })
    );

    const { state, caps } = choice();
    const result = validateBindingChoice(
      { ...state, freshKey: { ...state.freshKey, holderDidUrl: PRIMARY_DID } },
      caps
    );
    expect(result.errors.map((error) => error.code)).toContain('CONFLICTING_HOLDER_DID_URL');
  });

  it('rejects an unsupported DID method and proof algorithm (N-V-07, N-V-08)', () => {
    const { state, caps } = choice();
    const result = validateBindingChoice(
      selectFreshKey(state, { didMethod: 'did:polygon', signatureAlgorithm: 'XX99' }),
      caps
    );

    expect(result.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining(['UNSUPPORTED_DID_METHOD', 'UNSUPPORTED_PROOF_ALGORITHM'])
    );
  });

  it('rejects did:key with RSA (N-V-09)', () => {
    const { state, caps } = choice();
    const result = validateBindingChoice(
      selectFreshKey(state, { didMethod: 'did:key', signatureAlgorithm: 'RS256' }),
      caps
    );

    expect(result.errors.map((error) => error.code)).toContain('INCOMPATIBLE_DID_METHOD_AND_ALGORITHM');
  });

  it('rejects existing DID binding for mso_mdoc (N-V-10)', () => {
    const { state, caps } = choice({ capabilities: capabilities({ credentialFormats: ['mso_mdoc'] }) });
    const result = validateBindingChoice(selectExistingDid(state, PRIMARY_DID), caps);

    expect(result.errors.map((error) => error.code)).toContain('DID_BINDING_NOT_SUPPORTED_FOR_FORMAT');
  });

  it('rejects plain JWK fresh binding for ldp_vc (N-V-11)', () => {
    const caps = capabilities({ credentialFormats: ['ldp_vc'], didMethods: ['jwk'] });
    const { state } = choice({ capabilities: caps });
    const result = validateBindingChoice(selectFreshKey(state, { didMethod: 'jwk' }), caps);

    expect(result.errors.map((error) => error.code)).toContain('DID_BINDING_NOT_SUPPORTED_FOR_FORMAT');
  });

  it('rejects an unknown verification method for the holder tenant (N-V-12)', () => {
    const { state, caps } = choice();
    const result = validateBindingChoice(selectExistingDid(state, `${PRIMARY_DID}-unknown-fragment`), caps);

    expect(result.errors.map((error) => error.code)).toContain('DID_NOT_CONTROLLED_BY_HOLDER_TENANT');
  });

  it('rejects a malformed DID (N-V-13)', () => {
    const { state, caps } = choice();
    const result = validateBindingChoice(selectExistingDid(state, 'not-a-did'), caps);

    expect(result.errors.map((error) => error.code)).toContain('INVALID_HOLDER_DID_URL');
  });

  it('rejects a selected DID when the authoritative holder DID list is empty (N-V-14)', () => {
    const { caps } = choice();
    const state = createHolderBindingChoice({
      capabilities: caps,
      holderDids: [PRIMARY_DID],
      primaryDidUrl: PRIMARY_DID
    });
    const selected = selectExistingDid(state, PRIMARY_DID);

    expect(validateBindingChoice({ ...selected, holderDids: [] }, caps).errors.map((error) => error.code)).toContain(
      'PRIMARY_DID_NOT_FOUND'
    );
  });

  it('rejects a fresh key when no compatible method or algorithm remains (N-V-15)', () => {
    const noMethods = capabilities({ didMethods: [] });
    const noAlgorithms = capabilities({ signatureAlgorithms: [] });
    const { state: methodState } = choice({ capabilities: noMethods });
    const { state: algorithmState } = choice({ capabilities: noAlgorithms });

    expect(validateBindingChoice(methodState, noMethods).errors.map((error) => error.code)).toContain(
      'UNSUPPORTED_DID_METHOD'
    );
    expect(validateBindingChoice(algorithmState, noAlgorithms).errors.map((error) => error.code)).toContain(
      'UNSUPPORTED_PROOF_ALGORITHM'
    );
  });
});

describe('platform primary DID preference consumption (spec 5.2)', () => {
  it('builds and calls the GET path, accepting the API envelope', async () => {
    const httpGet = jest.fn().mockResolvedValue({ data: { didUrl: PRIMARY_DID, holderTenantId: 'tenant-1' } });
    const preference = await fetchPrimaryDidPreference('https://platform.example/', 'org/1', 'user/2', httpGet);

    expect(httpGet).toHaveBeenCalledWith(
      'https://platform.example/orgs/org%2F1/users/user%2F2/oid4vc/holder/primary-did',
      undefined
    );
    expect(preference).toEqual({ didUrl: PRIMARY_DID, holderTenantId: 'tenant-1' });
  });

  it('treats a 204/no-content response as no suggestion', () => {
    expect(normalizePrimaryDidResponse(null)).toBeNull();
    expect(normalizePrimaryDidResponse({ data: null })).toBeNull();
    expect(normalizePrimaryDidResponse({ didUrl: 'bad-did' })).toBeNull();
  });

  it('only suggests a primary DID that belongs to the holder DID list', () => {
    expect(suggestPrimaryDid({ didUrl: PRIMARY_DID }, [SECOND_DID])).toBeUndefined();
    expect(suggestPrimaryDid({ didUrl: PRIMARY_DID }, [PRIMARY_DID, SECOND_DID])).toBe(PRIMARY_DID);
  });

  it('reports a primary DID that vanished from the tenant before submit', () => {
    const { caps } = choice();
    const state = createHolderBindingChoice({
      capabilities: caps,
      holderDids: [PRIMARY_DID],
      primaryDidUrl: PRIMARY_DID
    });
    const selected = selectExistingDid(state, PRIMARY_DID);

    expect(
      validateBindingChoice({ ...selected, holderDids: [SECOND_DID] }, caps).errors.map((error) => error.code)
    ).toContain('PRIMARY_DID_NOT_FOUND');
  });
});
