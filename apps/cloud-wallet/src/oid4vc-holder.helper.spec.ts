import { withHolderBinding } from './oid4vc-holder.helper';

describe('withHolderBinding', () => {
  const base = {
    credentialOfferUri: 'openid-credential-offer://?credential_offer_uri=x',
    credentialsToRequest: ['UniversityDegreeCredential']
  };

  it('leaves the payload as it is when there is no holder DID', () => {
    expect(withHolderBinding({ ...base, txCode: '1234', sendNotification: false })).toEqual({
      ...base,
      txCode: '1234',
      sendNotification: false
    });
  });

  it('requires the binding by default when a holder DID is set', () => {
    expect(withHolderBinding({ ...base, holderDidUrl: 'did:web:example.com:holders:alice#key-1' })).toEqual({
      ...base,
      holderDidUrl: 'did:web:example.com:holders:alice#key-1',
      bindingPolicy: 'require'
    });
  });

  it('keeps an explicit binding policy', () => {
    expect(withHolderBinding({ ...base, holderDidUrl: 'did:web:example.com', bindingPolicy: 'prefer' })).toEqual({
      ...base,
      holderDidUrl: 'did:web:example.com',
      bindingPolicy: 'prefer'
    });
  });

  it('drops a binding policy that has no holder DID', () => {
    expect(withHolderBinding({ ...base, bindingPolicy: 'prefer' })).toEqual(base);
  });
});
