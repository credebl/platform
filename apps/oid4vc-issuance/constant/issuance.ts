import { AccessTokenSignerKeyType } from '../interfaces/oid4vc-issuance.interfaces';

export const dpopSigningAlgValuesSupported = ['RS256', 'ES256', 'EdDSA'];
export const credentialConfigurationsSupported = {};
export const accessTokenSignerKeyType = { kty: 'OKP', crv: 'Ed25519' } as {
  kty: string;
  crv: AccessTokenSignerKeyType;
};
export const batchCredentialIssuanceDefault = 0;
