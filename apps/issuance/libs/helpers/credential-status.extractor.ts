import { ICredential } from '../../interfaces/issuance.interfaces';

export interface ICredentialStatusDetails {
  statusListId?: string;
  statusListIndex?: number;
  statusListUri?: string;
  credentialVersion?: 'v1.0' | 'v2.0';
}

export function extractCredentialStatusDetails(credential?: ICredential | null): ICredentialStatusDetails {
  const status = credential?.credentialStatus;
  const statusListUri = status?.statusListCredential;
  const rawIndex = status?.statusListIndex;
  const parsedIndex = undefined === rawIndex || null === rawIndex || '' === rawIndex ? NaN : Number(rawIndex);
  const statusListIndex = Number.isNaN(parsedIndex) ? undefined : parsedIndex;
  const statusListId = statusListUri ? statusListUri.split('/').filter(Boolean).pop() : undefined;
  const contexts = Array.isArray(credential?.['@context']) ? credential['@context'] : [];
  const credentialVersion = contexts.includes('https://www.w3.org/ns/credentials/v2')
    ? 'v2.0'
    : statusListUri
      ? 'v1.0'
      : undefined;

  return {
    ...(statusListId ? { statusListId } : {}),
    ...(statusListIndex !== undefined ? { statusListIndex } : {}),
    ...(statusListUri ? { statusListUri } : {}),
    ...(credentialVersion ? { credentialVersion } : {})
  };
}
