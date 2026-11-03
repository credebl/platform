import { buildLdpVcCredentialConfig } from './issuer.metadata';

describe('buildLdpVcCredentialConfig', () => {
  it('advertises did:key and did:web as holder binding methods', () => {
    const config = buildLdpVcCredentialConfig('Test', {
      vct: 'https://example.com/Test',
      attributes: []
    } as never);

    const [entry] = Object.values(config);
    expect(entry.cryptographic_binding_methods_supported).toEqual(['did:key', 'did:web']);
  });
});
