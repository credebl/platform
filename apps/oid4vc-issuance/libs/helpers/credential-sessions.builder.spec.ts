/* eslint-disable camelcase */
import { UnprocessableEntityException } from '@nestjs/common';
import { credential_templates, SignerOption } from '@prisma/client';
import { CredentialFormat } from '@credebl/enum/enum';
import { VC_CONTEXT_V1, VC_CONTEXT_V2, VCVersion } from '@credebl/common/vc';
import { SdJwtTemplate } from '../../interfaces/oid4vc-template.interfaces';
import { SignerMethodOption } from '../../interfaces/oid4vc-issuer-sessions.interfaces';
import { buildCredentialOfferPayload } from './credential-sessions.builder';

const SCHEMA_URL = 'https://schema.credebl.id/schemas/3f1c3c1e-0d1a-4c8e-9a51-7c2c6b8f2a11';
const ORG_DID = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';

const jsonLdTemplateRecord = (attributes: Partial<SdJwtTemplate>): credential_templates => {
  const record = {
    id: 'template-1',
    name: 'Employee',
    format: CredentialFormat.JwtVcJsonLd,
    signerOption: SignerOption.DID,
    attributes: {
      vct: 'EmployeeCredential',
      attributes: [{ key: 'name', value_type: 'string', mandatory: true }],
      ...attributes
    }
  };
  return record as unknown as credential_templates;
};

const buildPayload = (template: credential_templates, version?: VCVersion): Record<string, unknown> => {
  const offer = buildCredentialOfferPayload(
    {
      authorizationType: 'noAuth',
      credentials: [{ templateId: template.id, payload: { name: 'Alice' }, ...(version ? { version } : {}) }]
    },
    [template],
    { publicId: 'issuer' },
    [{ method: SignerMethodOption.DID, did: ORG_DID }]
  );
  return offer.credentials[0].payload as Record<string, unknown>;
};

describe('buildCredentialOfferPayload JSON-LD version handling', () => {
  const v11Template = jsonLdTemplateRecord({ vcVersion: 'v1.1', context: [VC_CONTEXT_V1, SCHEMA_URL] });
  const v2Template = jsonLdTemplateRecord({ vcVersion: 'v2', context: [VC_CONTEXT_V2, SCHEMA_URL] });

  it('issues a VC 2.0 credential from a v2 template without a version in the request', () => {
    const payload = buildPayload(v2Template);

    expect(payload['@context']).toEqual([VC_CONTEXT_V2, SCHEMA_URL]);
    expect(payload.validFrom).toBeDefined();
    expect(payload).not.toHaveProperty('issuanceDate');
  });

  it('keeps issuing VC 1.1 credentials from v1.1 templates', () => {
    const payload = buildPayload(v11Template);

    expect(payload['@context']).toEqual([VC_CONTEXT_V1, SCHEMA_URL]);
    expect(payload.issuanceDate).toBeDefined();
    expect(payload).not.toHaveProperty('validFrom');
  });

  it('keeps issuing VC 1.1 credentials from templates created before vcVersion existed', () => {
    expect(buildPayload(jsonLdTemplateRecord({ context: [VC_CONTEXT_V1, SCHEMA_URL] }))['@context']).toEqual([
      VC_CONTEXT_V1,
      SCHEMA_URL
    ]);
    expect(buildPayload(jsonLdTemplateRecord({}))['@context']).toEqual([VC_CONTEXT_V1]);
  });

  it('accepts a matching version guard, treating v1 and v1.1 alike', () => {
    expect(() => buildPayload(v2Template, 'v2')).not.toThrow();
    expect(() => buildPayload(v11Template, 'v1.1')).not.toThrow();
    expect(() => buildPayload(v11Template, 'v1')).not.toThrow();
  });

  it('rejects a version guard that does not match the template', () => {
    expect(() => buildPayload(v2Template, 'v1.1')).toThrow(UnprocessableEntityException);
    expect(() => buildPayload(v11Template, 'v2')).toThrow(UnprocessableEntityException);
  });
});
