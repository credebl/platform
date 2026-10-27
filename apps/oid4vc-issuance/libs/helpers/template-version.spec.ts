import { BadRequestException } from '@nestjs/common';
import { CredentialFormat } from '@credebl/enum/enum';
import { VC_CONTEXT_V1, VC_CONTEXT_V2 } from '@credebl/common/vc';
import { MdocTemplate, SdJwtTemplate } from '../../interfaces/oid4vc-template.interfaces';
import { applyTemplateVcVersion, assertVcVersionSupportedForFormat } from './template-version';

const SCHEMA_URL = 'https://schema.credebl.id/schemas/3f1c3c1e-0d1a-4c8e-9a51-7c2c6b8f2a11';

const jsonLdTemplate = (overrides: Partial<SdJwtTemplate> = {}): SdJwtTemplate => ({
  vct: 'EmployeeCredential',
  attributes: [],
  ...overrides
});

describe('applyTemplateVcVersion', () => {
  it('keeps v1.1 as the default for new JSON-LD templates', () => {
    const result = applyTemplateVcVersion(CredentialFormat.JwtVcJsonLd, jsonLdTemplate({ schemaUrl: SCHEMA_URL }));

    expect(result.vcVersion).toBe('v1.1');
    expect(result.context).toEqual([VC_CONTEXT_V1, SCHEMA_URL]);
  });

  it('sets the v2 context for a v2 jwt_vc_json-ld template', () => {
    const result = applyTemplateVcVersion(
      CredentialFormat.JwtVcJsonLd,
      jsonLdTemplate({ schemaUrl: SCHEMA_URL, vcVersion: 'v2' })
    );

    expect(result.vcVersion).toBe('v2');
    expect(result.context).toEqual([VC_CONTEXT_V2, SCHEMA_URL]);
  });

  it('sets the base context when there is no schemaUrl', () => {
    const v2 = applyTemplateVcVersion(CredentialFormat.JwtVcJsonLd, jsonLdTemplate({ vcVersion: 'v2' }));
    const v11 = applyTemplateVcVersion(CredentialFormat.LdpVc, jsonLdTemplate());

    expect(v2.context).toEqual([VC_CONTEXT_V2]);
    expect(v11.context).toEqual([VC_CONTEXT_V1]);
  });

  it('replaces a stale context when the version changes', () => {
    const result = applyTemplateVcVersion(
      CredentialFormat.JwtVcJsonLd,
      jsonLdTemplate({ schemaUrl: SCHEMA_URL, context: [VC_CONTEXT_V1, SCHEMA_URL], vcVersion: 'v2' })
    );

    expect(result.context).toEqual([VC_CONTEXT_V2, SCHEMA_URL]);
  });

  it('uses the fallback version when vcVersion is omitted (template update)', () => {
    const result = applyTemplateVcVersion(CredentialFormat.JwtVcJsonLd, jsonLdTemplate(), 'v2');

    expect(result.vcVersion).toBe('v2');
    expect(result.context).toEqual([VC_CONTEXT_V2]);
  });

  it('rejects v2 for ldp_vc templates', () => {
    expect(() => applyTemplateVcVersion(CredentialFormat.LdpVc, jsonLdTemplate({ vcVersion: 'v2' }))).toThrow(
      BadRequestException
    );
    expect(() => applyTemplateVcVersion(CredentialFormat.LdpVc, jsonLdTemplate(), 'v2')).toThrow(BadRequestException);
  });

  it('allows v1 and v1.1 for ldp_vc templates', () => {
    expect(applyTemplateVcVersion(CredentialFormat.LdpVc, jsonLdTemplate({ vcVersion: 'v1' })).vcVersion).toBe('v1');
    expect(applyTemplateVcVersion(CredentialFormat.LdpVc, jsonLdTemplate({ vcVersion: 'v1.1' })).vcVersion).toBe(
      'v1.1'
    );
  });

  it('leaves SD-JWT and mdoc templates unchanged', () => {
    const sdJwt = jsonLdTemplate();
    const mdoc: MdocTemplate = { doctype: 'org.iso.18013.5.1.mDL', namespaces: [] };

    expect(applyTemplateVcVersion(CredentialFormat.SdJwtVc, sdJwt)).toBe(sdJwt);
    expect(applyTemplateVcVersion(CredentialFormat.Mdoc, mdoc)).toBe(mdoc);
  });

  it('rejects vcVersion on non JSON-LD templates', () => {
    expect(() => applyTemplateVcVersion(CredentialFormat.SdJwtVc, jsonLdTemplate({ vcVersion: 'v2' }))).toThrow(
      BadRequestException
    );
  });

  it('does not mutate the input template', () => {
    const input = jsonLdTemplate({ schemaUrl: SCHEMA_URL, vcVersion: 'v2' });
    applyTemplateVcVersion(CredentialFormat.JwtVcJsonLd, input);

    expect(input.context).toBeUndefined();
  });
});

describe('assertVcVersionSupportedForFormat', () => {
  it('only rejects v2 for ldp_vc', () => {
    expect(() => assertVcVersionSupportedForFormat(CredentialFormat.LdpVc, 'v2')).toThrow(BadRequestException);
    expect(() => assertVcVersionSupportedForFormat(CredentialFormat.LdpVc, 'v1.1')).not.toThrow();
    expect(() => assertVcVersionSupportedForFormat(CredentialFormat.JwtVcJsonLd, 'v2')).not.toThrow();
  });
});
