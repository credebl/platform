/* eslint-disable @typescript-eslint/no-explicit-any */
import { RequestCredentialDto } from './dtos/oid4vc-holder.dto';
import { withHolderBinding } from 'apps/cloud-wallet/src/oid4vc-holder.helper';
import { CloudWalletController } from './cloud-wallet.controller';

describe('OID4VC binding forwarding', () => {
  const base = {
    credentialOfferUri: 'openid-credential-offer://?credential_offer=eyJ',
    credentialsToRequest: ['UniversityDegreeCredential']
  };

  it('forwards an explicit new-key binding unchanged and never adds a holderDidUrl (P-FK-16, N-P-01)', () => {
    const binding = { mode: 'new-key' as const, didMethod: 'did:jwk', signatureAlgorithm: 'EdDSA' };

    expect(withHolderBinding({ ...base, binding })).toEqual({ ...base, binding });
  });

  it('forwards an existing-did binding chosen by the holder unchanged (P-ED-11)', () => {
    const binding = {
      mode: 'existing-did' as const,
      holderDidUrl: 'did:web:holder.example.com#key-1',
      policy: 'require' as const
    };

    expect(withHolderBinding({ ...base, binding })).toEqual({ ...base, binding });
  });

  it('preserves the legacy flat holderDidUrl and default policy (P-ED-01)', () => {
    const holderDidUrl = 'did:key:z6Mk#key-1';

    expect(withHolderBinding({ ...base, holderDidUrl })).toEqual({
      ...base,
      holderDidUrl,
      bindingPolicy: 'require'
    });
  });

  it('passes the validated gateway DTO, including binding, to the holder service unchanged', async () => {
    const binding = {
      mode: 'new-key' as const,
      didMethod: 'did:key',
      signatureAlgorithm: 'EdDSA'
    };
    const dto = { ...base, binding } as RequestCredentialDto;
    const requestCredential = jest.fn().mockResolvedValue({ id: 'credential-1' });
    const controller = new CloudWalletController({ requestCredential } as never);
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    } as any;

    await controller.requestCredential(res, dto, { id: 'user-1', email: 'holder@example.test' } as never);

    expect(requestCredential).toHaveBeenCalledWith({ ...dto, userId: 'user-1', email: 'holder@example.test' });
    expect(requestCredential.mock.calls[0][0].binding).toEqual(binding);
  });

  it('never injects a saved primary DID into a fresh-key request (N-P-01)', async () => {
    const preference = {
      orgId: 'org-1',
      userId: 'user-1',
      holderTenantId: 'tenant-1',
      didUrl: 'did:web:holder.example.com#key-1'
    };
    const requestCredential = jest.fn().mockResolvedValue({ id: 'credential-1' });
    const service = {
      requestCredential,
      getHolderPrimaryDidForUser: jest.fn().mockResolvedValue(preference)
    };
    const controller = new CloudWalletController(service as never);
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    } as any;
    const user = { id: 'user-1', email: 'holder@example.test' } as never;

    // The UI may read the suggestion...
    await controller.getHolderPrimaryDid('org-1', 'user-1', user, res);
    expect(service.getHolderPrimaryDidForUser).toHaveBeenCalledWith('org-1', 'user-1');

    // ...but choosing fresh key must not turn it into a holderDidUrl.
    const dto = { ...base, binding: { mode: 'new-key' as const } } as RequestCredentialDto;
    await controller.requestCredential(res, dto, user);

    const [[forwarded]] = requestCredential.mock.calls;
    expect(forwarded.holderDidUrl).toBeUndefined();
    expect(forwarded.binding).toEqual({ mode: 'new-key' });
    expect(withHolderBinding(forwarded)).not.toHaveProperty('holderDidUrl');
  });
});
