import { CommonConstants } from '@credebl/common/common.constant';

const trimTrailingSlashes = (value: string): string => value.trim().replace(/\/+$/, '');

const validateIssuer = (value: string): string => {
  const issuer = trimTrailingSlashes(value);
  const parsed = new URL(issuer);

  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(`Invalid trusted JWT issuer: ${value}`);
  }

  return issuer;
};

export const getTrustedJwtIssuers = (env: NodeJS.ProcessEnv = process.env): string[] => {
  const configuredIssuers = env.JWT_TRUSTED_ISSUERS?.split(',')
    .map((issuer) => issuer.trim())
    .filter(Boolean);

  const issuers = configuredIssuers?.length
    ? configuredIssuers
    : env.KEYCLOAK_DOMAIN && env.KEYCLOAK_REALM
      ? [`${trimTrailingSlashes(env.KEYCLOAK_DOMAIN)}/realms/${env.KEYCLOAK_REALM.trim()}`]
      : [];

  if (0 === issuers.length) {
    throw new Error('JWT_TRUSTED_ISSUERS or both KEYCLOAK_DOMAIN and KEYCLOAK_REALM must be configured');
  }

  return [...new Set(issuers.map(validateIssuer))];
};

export const getTrustedJwksUri = (issuer: unknown, trustedIssuers: string[]): string => {
  if ('string' !== typeof issuer) {
    throw new Error('JWT issuer is missing');
  }

  const normalizedIssuer = trimTrailingSlashes(issuer);
  if (!trustedIssuers.includes(normalizedIssuer)) {
    throw new Error('JWT issuer is not trusted');
  }

  return `${normalizedIssuer}${CommonConstants.URL_KEYCLOAK_JWKS}`;
};
