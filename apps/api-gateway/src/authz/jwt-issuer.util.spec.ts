import { getTrustedJwksUri, getTrustedJwtIssuers } from './jwt-issuer.util';

describe('trusted JWT issuers', () => {
  it('derives the Keycloak realm issuer when an explicit allowlist is not configured', () => {
    expect(getTrustedJwtIssuers({ KEYCLOAK_DOMAIN: 'https://identity.example/', KEYCLOAK_REALM: 'platform' })).toEqual([
      'https://identity.example/realms/platform'
    ]);
  });

  it('supports an explicit issuer allowlist and removes duplicates', () => {
    expect(
      getTrustedJwtIssuers({
        JWT_TRUSTED_ISSUERS:
          'https://id-a.example/realms/a, https://id-b.example/realms/b/,https://id-a.example/realms/a'
      })
    ).toEqual(['https://id-a.example/realms/a', 'https://id-b.example/realms/b']);
  });

  it('builds a JWKS URI only for an allowlisted issuer', () => {
    expect(
      getTrustedJwksUri('https://identity.example/realms/platform', ['https://identity.example/realms/platform'])
    ).toBe('https://identity.example/realms/platform/protocol/openid-connect/certs');
    expect(() =>
      getTrustedJwksUri('https://attacker.example/realms/platform', ['https://identity.example/realms/platform'])
    ).toThrow('JWT issuer is not trusted');
  });

  it('fails closed when no trusted issuer configuration exists', () => {
    expect(() => getTrustedJwtIssuers({})).toThrow('JWT_TRUSTED_ISSUERS');
  });
});
