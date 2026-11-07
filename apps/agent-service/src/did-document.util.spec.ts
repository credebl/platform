import { didDocumentsMatch } from './did-document.util';

describe('didDocumentsMatch', () => {
  const stored = {
    '@context': ['https://www.w3.org/ns/did/v1'],
    id: 'did:web:example.com',
    verificationMethod: [{ id: 'did:web:example.com#key-1', type: 'JsonWebKey2020', controller: 'did:web:example.com' }]
  };

  it('ignores the order of object keys at every depth', () => {
    const method = { controller: 'did:web:example.com', type: 'JsonWebKey2020', id: 'did:web:example.com#key-1' };
    const resolved = {
      verificationMethod: [method],
      id: 'did:web:example.com',
      '@context': ['https://www.w3.org/ns/did/v1']
    };

    expect(didDocumentsMatch(resolved, stored)).toBe(true);
  });

  it('detects a difference in values', () => {
    expect(didDocumentsMatch({ ...stored, id: 'did:web:other.example.com' }, stored)).toBe(false);
  });

  it('keeps array order significant', () => {
    expect(didDocumentsMatch({ list: [1, 2] }, { list: [2, 1] })).toBe(false);
  });

  it('parses a stored document kept as a JSON string', () => {
    expect(
      didDocumentsMatch(
        stored,
        JSON.stringify({ id: stored.id, '@context': stored['@context'], verificationMethod: stored.verificationMethod })
      )
    ).toBe(true);
  });

  it('does not match when either document is missing', () => {
    expect(didDocumentsMatch(undefined, stored)).toBe(false);
    expect(didDocumentsMatch(stored, null)).toBe(false);
  });
});
