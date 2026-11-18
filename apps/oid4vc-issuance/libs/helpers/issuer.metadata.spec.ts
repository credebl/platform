import {
  buildCredentialConfigurationsSupported,
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

describe('issuer-level default binding methods', () => {
  const row = (name: string, format: string, attributes: object): Record<string, unknown> => ({
    name,
    format,
    attributes,
    appearance: {}
  });

  it('applies the issuer default to templates without their own list, and lets a template override it', () => {
    const configs = buildCredentialConfigurationsSupported(
      [
        row('plain', 'ldp_vc', baseTemplate),
        row('custom', 'ldp_vc', { ...baseTemplate, cryptographicBindingMethods: ['did:key'] })
      ],
      ['did:web', 'did:polygon']
    );
    expect(configs['plain-ldp-vc'].cryptographic_binding_methods_supported).toEqual(['did:web', 'did:polygon']);
    expect(configs['custom-ldp-vc'].cryptographic_binding_methods_supported).toEqual(['did:key']);
  });

  it('falls back to the per-format defaults when the issuer has none', () => {
    const configs = buildCredentialConfigurationsSupported([row('plain', 'ldp_vc', baseTemplate)], []);
    expect(configs['plain-ldp-vc'].cryptographic_binding_methods_supported).toEqual(['did:key', 'did:web']);
  });

  it('leaves mso_mdoc on jwk', () => {
    const configs = buildCredentialConfigurationsSupported(
      [row('mdl', 'mso_mdoc', { doctype: 'org.iso.18013.5.1.mDL', namespaces: [] })],
      ['did:web']
    );
    expect(Object.values(configs)[0].cryptographic_binding_methods_supported).toEqual(['jwk']);
  });

  it('advertises COSE algorithm numbers for mso_mdoc', () => {
    const configs = buildCredentialConfigurationsSupported(
      [row('mdl', 'mso_mdoc', { doctype: 'org.iso.18013.5.1.mDL', namespaces: [] })],
      []
    );
    expect(Object.values(configs)[0].credential_signing_alg_values_supported).toEqual([-7]);
  });
});
