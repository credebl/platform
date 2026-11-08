import { extractCredentialStatusDetails } from './credential-status.extractor';

const credentialStatus = {
  id: 'https://status.example.com/status-lists/list-1#3',
  type: 'BitstringStatusListEntry',
  statusPurpose: 'revocation',
  statusListIndex: '3',
  statusListCredential: 'https://status.example.com/status-lists/list-1'
};

describe('extractCredentialStatusDetails', () => {
  it('extracts V1 status list allocation details', () => {
    expect(
      extractCredentialStatusDetails({
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        credentialStatus
      })
    ).toEqual({
      statusListId: 'list-1',
      statusListIndex: 3,
      statusListUri: 'https://status.example.com/status-lists/list-1',
      credentialVersion: 'v1.0'
    });
  });

  it('detects V2 credentials', () => {
    expect(
      extractCredentialStatusDetails({
        '@context': ['https://www.w3.org/ns/credentials/v2'],
        type: ['VerifiableCredential'],
        credentialStatus
      }).credentialVersion
    ).toBe('v2.0');
  });

  it('returns no status details without a credentialStatus entry', () => {
    expect(extractCredentialStatusDetails({ '@context': [], type: [] })).toEqual({});
    expect(extractCredentialStatusDetails()).toEqual({});
  });
});
