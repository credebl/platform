import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { VC_CONTEXT_V1, VC_CONTEXT_V2 } from '@credebl/common/vc';
import { IssueCredentialDto } from './multi-connection.dto';
import { OOBCredentialDtoWithEmail } from './issuance.dto';

const v2Credential = {
  '@context': [VC_CONTEXT_V2],
  type: ['VerifiableCredential', 'Degree'],
  issuer: { id: 'did:example:issuer' },
  validFrom: '2026-01-01T00:00:00.000Z',
  credentialSubject: { id: 'did:example:subject' }
};

const v11Credential = {
  '@context': [VC_CONTEXT_V1],
  type: ['VerifiableCredential', 'Degree'],
  issuer: { id: 'did:example:issuer' },
  issuanceDate: '2026-01-01T00:00:00.000Z',
  credentialSubject: { id: 'did:example:subject' }
};

const options = { proofType: 'Ed25519Signature2018', proofPurpose: 'assertionMethod' };

function buildIssueCredentialDto(version: string, credential: Record<string, unknown>): IssueCredentialDto {
  return plainToInstance(IssueCredentialDto, {
    version,
    credentialData: [{ connectionId: 'connection-id', credential, options }]
  });
}

function findVersionError(errors: Awaited<ReturnType<typeof validate>>): string | undefined {
  return errors.find((error) => 'credentialData' === error.property)?.constraints?.isCredentialsVersionConsistent;
}

describe('IssueCredentialDto VC version validation', () => {
  it('accepts a VC 2.0 credential when v2 is requested', async () => {
    const errors = await validate(buildIssueCredentialDto('v2', v2Credential));

    expect(errors).toEqual([]);
  });

  it('accepts a VC 1.1 credential when v1.1 is requested', async () => {
    const errors = await validate(buildIssueCredentialDto('v1.1', v11Credential));

    expect(errors).toEqual([]);
  });

  it('rejects a v1 context when v2 is requested', async () => {
    const errors = await validate(buildIssueCredentialDto('v2', v11Credential));

    expect(findVersionError(errors)).toContain(`@context must include ${VC_CONTEXT_V2} for VC 2.0`);
  });

  it('rejects issuanceDate on a VC 2.0 credential', async () => {
    const errors = await validate(
      buildIssueCredentialDto('v2', { ...v2Credential, issuanceDate: '2026-01-01T00:00:00.000Z' })
    );

    expect(findVersionError(errors)).toContain('issuanceDate is not part of VC 2.0');
  });

  it('requires issuanceDate for VC 1.1 credentials', async () => {
    const credentialWithoutIssuanceDate = { ...v11Credential } as Record<string, unknown>;
    delete credentialWithoutIssuanceDate.issuanceDate;
    const errors = await validate(buildIssueCredentialDto('v1.1', credentialWithoutIssuanceDate));

    expect(findVersionError(errors)).toContain('issuanceDate is required for VC 1.1');
  });
});

describe('OOBCredentialDtoWithEmail VC version validation', () => {
  function buildOobDto(version: string, credential: Record<string, unknown>): OOBCredentialDtoWithEmail {
    return plainToInstance(OOBCredentialDtoWithEmail, {
      version,
      credentialOffer: [{ emailId: 'user@example.com', credential, options }]
    });
  }

  it('accepts a VC 2.0 credential offer when v2 is requested', async () => {
    const errors = await validate(buildOobDto('v2', v2Credential));

    expect(errors).toEqual([]);
  });

  it('rejects a VC 1.1 credential offer when v2 is requested', async () => {
    const errors = await validate(buildOobDto('v2', v11Credential));

    expect(errors.find((error) => 'credentialOffer' === error.property)?.constraints).toHaveProperty(
      'isCredentialsVersionConsistent'
    );
  });
});
