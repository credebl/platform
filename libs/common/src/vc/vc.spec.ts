import {
  buildCredentialContext,
  getCredentialVersionProblems,
  mapCredentialForVersion,
  resolveSchemaReference,
  VC_CONTEXT_V1,
  VC_CONTEXT_V2,
  VersionedCredentialLike,
  withRefreshedValidityDates
} from './vc';

const SCHEMA_URL = 'https://schema.credebl.id/schemas/degree';

describe('vc helpers', () => {
  describe('buildCredentialContext', () => {
    it('puts the v2 base context first and drops the v1 base context', () => {
      expect(buildCredentialContext([VC_CONTEXT_V1, SCHEMA_URL], 'v2')).toEqual([VC_CONTEXT_V2, SCHEMA_URL]);
    });

    it('puts the v1 base context first and drops the v2 base context', () => {
      expect(buildCredentialContext([VC_CONTEXT_V2, SCHEMA_URL], 'v1.1')).toEqual([VC_CONTEXT_V1, SCHEMA_URL]);
    });

    it('keeps the schema reference for v2 credentials', () => {
      expect(buildCredentialContext(SCHEMA_URL, 'v2')).toEqual([VC_CONTEXT_V2, SCHEMA_URL]);
    });

    it('does not duplicate an existing schema reference or base context', () => {
      expect(buildCredentialContext([VC_CONTEXT_V2, SCHEMA_URL], 'v2', SCHEMA_URL)).toEqual([
        VC_CONTEXT_V2,
        SCHEMA_URL
      ]);
    });

    it('does not append w3.org contexts as schema references', () => {
      expect(buildCredentialContext(undefined, 'v2', VC_CONTEXT_V1)).toEqual([VC_CONTEXT_V2]);
    });
  });

  describe('mapCredentialForVersion', () => {
    const baseOptions = {
      existingContext: [VC_CONTEXT_V1, SCHEMA_URL],
      issuer: { id: 'did:example:issuer' },
      credentialSubject: { id: 'did:example:subject' },
      type: ['VerifiableCredential', 'Degree'],
      issuanceDate: '2024-01-01T00:00:00.000Z',
      expirationDate: '2025-01-01T00:00:00.000Z'
    };

    it('emits only VC 2.0 date fields for v2', () => {
      const credential = mapCredentialForVersion({ ...baseOptions, version: 'v2' });

      expect(credential.validFrom).toBe(baseOptions.issuanceDate);
      expect(credential.validUntil).toBe(baseOptions.expirationDate);
      expect(credential).not.toHaveProperty('issuanceDate');
      expect(credential).not.toHaveProperty('expirationDate');
      expect(credential['@context']).toEqual([VC_CONTEXT_V2, SCHEMA_URL]);
    });

    it('emits only VC 1.1 date fields for v1.1', () => {
      const credential = mapCredentialForVersion({
        ...baseOptions,
        version: 'v1.1',
        issuanceDate: undefined,
        expirationDate: undefined,
        validFrom: '2024-02-01T00:00:00.000Z',
        validUntil: '2025-02-01T00:00:00.000Z'
      });

      expect(credential.issuanceDate).toBe('2024-02-01T00:00:00.000Z');
      expect(credential.expirationDate).toBe('2025-02-01T00:00:00.000Z');
      expect(credential).not.toHaveProperty('validFrom');
      expect(credential).not.toHaveProperty('validUntil');
    });

    it('uses an object issuer for v2 even when a string issuer is provided', () => {
      const credential = mapCredentialForVersion({
        version: 'v2',
        issuer: 'did:example:issuer',
        credentialSubject: baseOptions.credentialSubject,
        issuanceDate: baseOptions.issuanceDate
      });

      expect(credential.issuer).toEqual({ id: 'did:example:issuer' });
    });
  });

  describe('getCredentialVersionProblems', () => {
    it('accepts a consistent VC 2.0 credential', () => {
      expect(
        getCredentialVersionProblems(
          { '@context': [VC_CONTEXT_V2], validFrom: '2024-01-01T00:00:00.000Z' },
          'v2'
        )
      ).toEqual([]);
    });

    it('rejects VC 1.1 date fields on a VC 2.0 credential', () => {
      const problems = getCredentialVersionProblems(
        { '@context': [VC_CONTEXT_V2], issuanceDate: '2024-01-01T00:00:00.000Z' },
        'v2'
      );

      expect(problems).toEqual(['issuanceDate is not part of VC 2.0, use validFrom instead']);
    });

    it('rejects a v1 context when VC 2.0 is requested', () => {
      const problems = getCredentialVersionProblems({ '@context': [VC_CONTEXT_V1] }, 'v2');

      expect(problems).toContain(`@context must include ${VC_CONTEXT_V2} for VC 2.0`);
    });

    it('requires issuanceDate for VC 1.1', () => {
      const problems = getCredentialVersionProblems(
        { '@context': [VC_CONTEXT_V1], validFrom: '2024-01-01T00:00:00.000Z' },
        'v1.1'
      );

      expect(problems).toEqual(['issuanceDate is required for VC 1.1']);
    });

    it('accepts a consistent VC 1.1 credential', () => {
      expect(
        getCredentialVersionProblems(
          { '@context': [VC_CONTEXT_V1], issuanceDate: '2024-01-01T00:00:00.000Z' },
          'v1.1'
        )
      ).toEqual([]);
    });
  });

  describe('resolveSchemaReference', () => {
    it('resolves the schema URL from the second context entry', () => {
      expect(resolveSchemaReference({ '@context': [VC_CONTEXT_V1, SCHEMA_URL] })).toBe(SCHEMA_URL);
    });

    it('resolves the schema URL from a v2 context that is not at index 1', () => {
      expect(
        resolveSchemaReference({ '@context': [VC_CONTEXT_V2, 'https://www.w3.org/ns/credentials/examples/v2', SCHEMA_URL] })
      ).toBe(SCHEMA_URL);
    });

    it('prefers an HTTP credentialSchema id', () => {
      expect(
        resolveSchemaReference({
          '@context': [VC_CONTEXT_V2],
          credentialSchema: { id: SCHEMA_URL, type: 'JsonSchema' }
        })
      ).toBe(SCHEMA_URL);
    });

    it('falls back to a non-HTTP credentialSchema id', () => {
      expect(
        resolveSchemaReference({
          '@context': [VC_CONTEXT_V2],
          credentialSchema: { id: 'did:example:schema', type: 'JsonSchema' }
        })
      ).toBe('did:example:schema');
    });
  });

  describe('withRefreshedValidityDates', () => {
    const now = new Date('2026-01-15T10:00:00.000Z');

    it('refreshes a past start date for v2 and keeps v2 field names', () => {
      const credential = withRefreshedValidityDates(
        {
          '@context': [VC_CONTEXT_V2],
          validFrom: '2025-01-01T00:00:00.000Z',
          validUntil: '2027-01-01T00:00:00.000Z'
        },
        'v2',
        now
      );

      expect(credential.validFrom).toBe(now.toISOString());
      expect(credential.validUntil).toBe('2027-01-01T00:00:00.000Z');
      expect(credential).not.toHaveProperty('issuanceDate');
    });

    it('keeps a future start date untouched', () => {
      const credential = withRefreshedValidityDates(
        {
          '@context': [VC_CONTEXT_V2],
          validFrom: '2026-06-01T00:00:00.000Z'
        },
        'v2',
        now
      );

      expect(credential.validFrom).toBe('2026-06-01T00:00:00.000Z');
    });

    it('maps v2 fields back to v1.1 fields when v1.1 is requested', () => {
      const credential: VersionedCredentialLike = withRefreshedValidityDates(
        {
          '@context': [VC_CONTEXT_V1],
          validFrom: '2025-01-01T00:00:00.000Z',
          validUntil: '2027-01-01T00:00:00.000Z'
        },
        'v1.1',
        now
      );

      expect(credential.issuanceDate).toBe(now.toISOString());
      expect(credential.expirationDate).toBe('2027-01-01T00:00:00.000Z');
      expect(credential).not.toHaveProperty('validFrom');
      expect(credential).not.toHaveProperty('validUntil');
    });

    it('does not mutate the input credential', () => {
      const original = { '@context': [VC_CONTEXT_V2], validFrom: '2025-01-01T00:00:00.000Z' };
      withRefreshedValidityDates(original, 'v2', now);

      expect(original.validFrom).toBe('2025-01-01T00:00:00.000Z');
    });
  });
});
