import { AccessTokenSignerKeyType } from '../interfaces/oid4vc-issuance.interfaces';

export const dpopSigningAlgValuesSupported = ['RS256', 'ES256', 'EdDSA'];
export const credentialConfigurationsSupported = {};
export const accessTokenSignerKeyType = 'ed25519' as AccessTokenSignerKeyType;
export const batchCredentialIssuanceDefault = 0;
