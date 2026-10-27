/* eslint-disable camelcase */
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CredentialFormat } from '@credebl/enum/enum';
import { CreateOidcCredentialOfferDto } from './issuer-sessions.dto';
import { CreateCredentialTemplateDto, SdJwtTemplateDto } from './oid4vc-issuer-template.dto';

const templatePayload = (template: Record<string, unknown>): Record<string, unknown> => ({
  name: 'Employee',
  format: CredentialFormat.JwtVcJsonLd,
  canBeRevoked: false,
  template: {
    vct: 'EmployeeCredential',
    attributes: [{ key: 'name', value_type: 'string', mandatory: true }],
    ...template
  }
});

describe('OID4VC VC version DTOs', () => {
  describe('CreateOidcCredentialOfferDto', () => {
    it('does not default the credential version, so the template decides it', async () => {
      const dto = plainToInstance(CreateOidcCredentialOfferDto, {
        authorizationType: 'noAuth',
        credentials: [{ templateId: 'template-1', payload: { name: 'Alice' } }]
      });

      expect(dto.credentials[0].version).toBeUndefined();
      expect(await validate(dto)).toHaveLength(0);
    });

    it('accepts a supported version guard and rejects an unknown one', async () => {
      const valid = plainToInstance(CreateOidcCredentialOfferDto, {
        authorizationType: 'noAuth',
        credentials: [{ templateId: 'template-1', payload: {}, version: 'v2' }]
      });
      const invalid = plainToInstance(CreateOidcCredentialOfferDto, {
        authorizationType: 'noAuth',
        credentials: [{ templateId: 'template-1', payload: {}, version: 'v2.0' }]
      });

      expect(await validate(valid)).toHaveLength(0);
      expect(await validate(invalid)).not.toHaveLength(0);
    });
  });

  describe('CreateCredentialTemplateDto', () => {
    it('keeps vcVersion optional so existing template requests stay valid', async () => {
      const dto = plainToInstance(CreateCredentialTemplateDto, templatePayload({}));

      expect((dto.template as SdJwtTemplateDto).vcVersion).toBeUndefined();
      expect(await validate(dto)).toHaveLength(0);
    });

    it('accepts vcVersion v1.1 and v2', async () => {
      for (const vcVersion of ['v1.1', 'v2']) {
        const dto = plainToInstance(CreateCredentialTemplateDto, templatePayload({ vcVersion }));
        expect(await validate(dto)).toHaveLength(0);
      }
    });

    it('rejects an unknown vcVersion', async () => {
      const dto = plainToInstance(CreateCredentialTemplateDto, templatePayload({ vcVersion: 'v3' }));

      expect(await validate(dto)).not.toHaveLength(0);
    });
  });
});
