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

  it('forwards a nested fresh-key binding without any flat holder DID', () => {
    expect(withHolderBinding({ ...base, binding: { mode: 'new-key', didMethod: 'did:jwk' } })).toEqual({
      ...base,
      binding: { mode: 'new-key', didMethod: 'did:jwk' }
    });
  });

  it('forwards a nested existing-DID binding and agrees with a matching flat DID', () => {
    const holderDidUrl = 'did:web:example.com:holders:alice#key-1';
    expect(
      withHolderBinding({ ...base, holderDidUrl, binding: { mode: 'existing-did', holderDidUrl, policy: 'prefer' } })
    ).toEqual({
      ...base,
      binding: { mode: 'existing-did', holderDidUrl, policy: 'prefer' }
    });
  });

  it('rejects did:key with an RSA algorithm before the request is forwarded', () => {
    const payload = {
      ...base,
      binding: { mode: 'new-key' as const, didMethod: 'did:key', signatureAlgorithm: 'RS256' }
    };

    expect(() => withHolderBinding(payload)).toThrow(
      expect.objectContaining({ codes: ['INCOMPATIBLE_DID_METHOD_AND_ALGORITHM'] })
    );
  });
});
