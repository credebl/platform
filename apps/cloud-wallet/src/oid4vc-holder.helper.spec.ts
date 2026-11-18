import { BadRequestException } from '@nestjs/common';
import { buildRequestCredentialPayload, toCredentialOfferLink } from './oid4vc-holder.helper';

describe('toCredentialOfferLink', () => {
  it('keeps an openid-credential-offer link as it is', () => {
    const link = 'openid-credential-offer://?credential_offer_uri=https%3A%2F%2Fissuer.example%2Foffers%2F1';
    expect(toCredentialOfferLink(`  ${link} `)).toBe(link);
  });

  it('wraps an https offer URI into a link', () => {
    expect(toCredentialOfferLink('https://issuer.example/oid4vci/dgft/offers/1')).toBe(
      'openid-credential-offer://?credential_offer_uri=https%3A%2F%2Fissuer.example%2Foid4vci%2Fdgft%2Foffers%2F1'
    );
  });

  it('rejects anything else', () => {
    expect(() => toCredentialOfferLink('')).toThrow(BadRequestException);
    expect(() => toCredentialOfferLink('ftp://issuer.example/offer')).toThrow(BadRequestException);
  });
});

describe('buildRequestCredentialPayload', () => {
  const credentialOffer = 'openid-credential-offer://?credential_offer_uri=x';

  it('sends only the offer when nothing else is set', () => {
    expect(buildRequestCredentialPayload({ credentialOffer })).toEqual({ credentialOfferUri: credentialOffer });
  });

  it('binds to the holder DID and requires the binding by default', () => {
    expect(
      buildRequestCredentialPayload({
        credentialOffer,
        txCode: '1234',
        holderDidUrl: 'did:web:dgft.gov.in:iec:0512345678#key-1'
      })
    ).toEqual({
      credentialOfferUri: credentialOffer,
      txCode: '1234',
      holderDidUrl: 'did:web:dgft.gov.in:iec:0512345678#key-1',
      bindingPolicy: 'require'
    });
  });

  it('passes an explicit binding policy, the requested ids and the notification choice', () => {
    expect(
      buildRequestCredentialPayload({
        credentialOffer,
        holderDidUrl: 'did:web:example.com',
        bindingPolicy: 'prefer',
        credentialsToRequest: ['IEC-sdjwt'],
        sendNotification: false
      })
    ).toEqual({
      credentialOfferUri: credentialOffer,
      holderDidUrl: 'did:web:example.com',
      bindingPolicy: 'prefer',
      credentialsToRequest: ['IEC-sdjwt'],
      sendNotification: false
    });
  });

  it('ignores a binding policy without a holder DID, as the agent does', () => {
    expect(buildRequestCredentialPayload({ credentialOffer, bindingPolicy: 'prefer' })).toEqual({
      credentialOfferUri: credentialOffer
    });
  });
});
