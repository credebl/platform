import { getTrustedJwksUri, getTrustedJwtIssuers } from './jwt-issuer.util';

describe('trusted JWT issuers', () => {
  it('derives the Keycloak realm issuer when an explicit allowlist is not configured', () => {
    const env = { KEYCLOAK_DOMAIN: 'https://identity.example/', KEYCLOAK_REALM: 'platform' };
    expect(getTrustedJwtIssuers(env)).toEqual(['https://identity.example/realms/platform']);
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
    const issuer = 'https://identity.example/realms/platform';
    const attackerIssuer = 'https://attacker.example/realms/platform';
    const trustedIssuers = [issuer];
    expect(getTrustedJwksUri(issuer, trustedIssuers)).toBe(
      'https://identity.example/realms/platform/protocol/openid-connect/certs'
    );
    expect(() => getTrustedJwksUri(attackerIssuer, trustedIssuers)).toThrow('JWT issuer is not trusted');
  });

  it('fails closed when no trusted issuer configuration exists', () => {
    expect(() => getTrustedJwtIssuers({})).toThrow('JWT_TRUSTED_ISSUERS');
  });

  it('allows HTTP only for explicit loopback issuers', () => {
    const loopbackEnv = { JWT_TRUSTED_ISSUERS: 'http://localhost:8080/realms/platform' };
    expect(getTrustedJwtIssuers(loopbackEnv)).toEqual(['http://localhost:8080/realms/platform']);
    expect(() => getTrustedJwtIssuers({ JWT_TRUSTED_ISSUERS: 'http://identity.example/realms/platform' })).toThrow(
      'Invalid trusted JWT issuer'
    );
  });
});
