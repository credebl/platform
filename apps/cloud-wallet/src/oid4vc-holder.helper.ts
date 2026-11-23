import { IRequestCredential } from '@credebl/common/interfaces/cloud-wallet.interface';

type RequestCredentialPayload = Omit<IRequestCredential, 'userId' | 'email'>;

/**
 * The body of the agent's `request-credential` call. When the credentials are bound to a DID of the wallet
 * (`holderDidUrl`), the binding is required unless the caller asks for `prefer`. Without a `holderDidUrl` the
 * binding options are left out, as the agent ignores them.
 */
export function withHolderBinding(payload: RequestCredentialPayload): RequestCredentialPayload {
  const { holderDidUrl, bindingPolicy, ...rest } = payload;
  return holderDidUrl ? { ...rest, holderDidUrl, bindingPolicy: bindingPolicy ?? 'require' } : rest;
}
