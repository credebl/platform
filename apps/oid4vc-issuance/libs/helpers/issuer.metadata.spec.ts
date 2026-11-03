import {
  buildJwtVcJsonLdCredentialConfig,
  buildLdpVcCredentialConfig,
  buildSdJwtCredentialConfig
} from './issuer.metadata';

const baseTemplate = { vct: 'https://example.com/Test', attributes: [] };
function bindingMethods(config: Record<string, { cryptographic_binding_methods_supported: string[] }>): string[] {
  return Object.values(config)[0].cryptographic_binding_methods_supported;
}

describe('cryptographic_binding_methods_supported', () => {
  it('defaults ldp_vc to did:key and did:web', () => {
    expect(bindingMethods(buildLdpVcCredentialConfig('Test', baseTemplate))).toEqual(['did:key', 'did:web']);
  });

  it('keeps the SD-JWT and jwt_vc_json-ld defaults', () => {
    const defaults = ['did:key', 'did:web', 'did:jwk', 'jwk'];
    expect(bindingMethods(buildSdJwtCredentialConfig('Test', baseTemplate))).toEqual(defaults);
    expect(bindingMethods(buildJwtVcJsonLdCredentialConfig('Test', baseTemplate))).toEqual(defaults);
  });

  it('uses the per-template list when provided, without duplicates', () => {
    const template = { ...baseTemplate, cryptographicBindingMethods: ['did:web', 'did:cheqd', 'did:web'] };
    const expected = ['did:web', 'did:cheqd'];
    expect(bindingMethods(buildLdpVcCredentialConfig('Test', template))).toEqual(expected);
    expect(bindingMethods(buildSdJwtCredentialConfig('Test', template))).toEqual(expected);
    expect(bindingMethods(buildJwtVcJsonLdCredentialConfig('Test', template))).toEqual(expected);
  });

  it('falls back to defaults for an empty list', () => {
    const template = { ...baseTemplate, cryptographicBindingMethods: [] };
    expect(bindingMethods(buildLdpVcCredentialConfig('Test', template))).toEqual(['did:key', 'did:web']);
  });
});
