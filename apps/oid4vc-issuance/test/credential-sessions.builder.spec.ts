import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SignerOption, credential_templates as CredentialTemplate } from '@prisma/client';
import { CredentialFormat } from '@credebl/enum/enum';
import { AuthenticationType } from '../interfaces/oid4vc-issuer-sessions.interfaces';
import {
  CreateOidcCredentialOfferDtoLike,
  SignerMethodOption,
  buildCredentialOfferPayload,
  resolveOfferRevocability
} from '../libs/helpers/credential-sessions.builder';

function makeTemplate(
  id: string,
  canBeRevoked: boolean,
  format: CredentialFormat = CredentialFormat.SdJwtVc
): CredentialTemplate {
  return {
    id,
    name: `Template ${id}`,
    canBeRevoked,
    format,
    signerOption: SignerOption.DID,
    attributes: {
      vct: `https://example.com/${id}`,
      attributes: [{ key: 'name', mandatory: false }]
    }
  } as unknown as CredentialTemplate;
}

const makeDto = (templateIds: string[], isRevocable?: boolean): CreateOidcCredentialOfferDtoLike => ({
  credentials: templateIds.map((templateId) => ({
    templateId,
    payload: { name: 'Alice' }
  })),
  authorizationType: AuthenticationType.NO_AUTH,
  ...(undefined !== isRevocable ? { isRevocable } : {})
});

describe('resolveOfferRevocability', () => {
  it('derives false when all templates are non-revocable and flag is omitted', () => {
    const templates = [makeTemplate('tpl-1', false), makeTemplate('tpl-2', false)];

    expect(resolveOfferRevocability(makeDto(['tpl-1', 'tpl-2']), templates)).toBe(false);
  });

  it('accepts explicit false when all templates are non-revocable', () => {
    const templates = [makeTemplate('tpl-1', false), makeTemplate('tpl-2', false)];

    expect(resolveOfferRevocability(makeDto(['tpl-1', 'tpl-2'], false), templates)).toBe(false);
  });

  it('rejects explicit true when all templates are non-revocable', () => {
    const templates = [makeTemplate('tpl-1', false), makeTemplate('tpl-2', false)];

    expect(() => resolveOfferRevocability(makeDto(['tpl-1', 'tpl-2'], true), templates)).toThrow(BadRequestException);
  });

  it('derives true when all templates are revocable and flag is omitted', () => {
    const templates = [makeTemplate('tpl-1', true), makeTemplate('tpl-2', true)];

    expect(resolveOfferRevocability(makeDto(['tpl-1', 'tpl-2']), templates)).toBe(true);
  });

  it('accepts explicit true when all templates are revocable', () => {
    const templates = [makeTemplate('tpl-1', true), makeTemplate('tpl-2', true)];

    expect(resolveOfferRevocability(makeDto(['tpl-1', 'tpl-2'], true), templates)).toBe(true);
  });

  it('rejects explicit false when all templates are revocable', () => {
    const templates = [makeTemplate('tpl-1', true), makeTemplate('tpl-2', true)];

    expect(() => resolveOfferRevocability(makeDto(['tpl-1', 'tpl-2'], false), templates)).toThrow(BadRequestException);
  });

  it('rejects offers with mixed template revocation settings', () => {
    const templates = [makeTemplate('tpl-1', true), makeTemplate('tpl-2', false)];

    expect(() => resolveOfferRevocability(makeDto(['tpl-1', 'tpl-2']), templates)).toThrow(BadRequestException);
  });

  it('rejects unknown template ids', () => {
    const templates = [makeTemplate('tpl-1', false)];

    expect(() => resolveOfferRevocability(makeDto(['tpl-1', 'missing']), templates)).toThrow(NotFoundException);
  });

  it('rejects revocable mdoc templates', () => {
    const templates = [
      makeTemplate('tpl-1', true, CredentialFormat.SdJwtVc),
      makeTemplate('tpl-2', true, CredentialFormat.Mdoc)
    ];

    expect(() => resolveOfferRevocability(makeDto(['tpl-1', 'tpl-2']), templates)).toThrow(BadRequestException);
  });
});

describe('buildCredentialOfferPayload', () => {
  it('uses the derived revocability in the offer envelope and on credentials', () => {
    const templates = [makeTemplate('tpl-1', true), makeTemplate('tpl-2', true)];
    const offer = buildCredentialOfferPayload(makeDto(['tpl-1', 'tpl-2']), templates, undefined, [
      { method: SignerMethodOption.DID, did: 'did:example:issuer' }
    ]);

    expect(offer.isRevocable).toBe(true);
    expect(offer.credentials).toHaveLength(2);
    expect(offer.credentials.every((credential) => true === credential.isRevocable)).toBe(true);
  });

  it('keeps non-revocable offers without an explicit flag', () => {
    const templates = [makeTemplate('tpl-1', false, CredentialFormat.SdJwtVc)];
    const offer = buildCredentialOfferPayload(makeDto(['tpl-1']), templates, undefined, [
      { method: SignerMethodOption.DID, did: 'did:example:issuer' }
    ]);

    expect(offer.isRevocable).toBe(false);
    expect(offer.credentials[0].isRevocable).toBe(false);
  });
});
