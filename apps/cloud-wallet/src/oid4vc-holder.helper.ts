import { BadRequestException } from '@nestjs/common';
import { ICloudWalletOid4vcRequestCredential } from '@credebl/common/interfaces/cloud-wallet.interface';

const OFFER_SCHEME = 'openid-credential-offer://';

/**
 * The agent takes the offer as an `openid-credential-offer://` link. Wallet apps usually have that link (from a QR
 * code), but an issuer's offer URI (`https://…/offers/<id>`) is accepted too and wrapped into a link.
 */
export function toCredentialOfferLink(credentialOffer: string): string {
  const offer = credentialOffer?.trim();
  if (!offer) {
    throw new BadRequestException('credentialOffer is required');
  }
  if (offer.startsWith(OFFER_SCHEME)) {
    return offer;
  }
  if (/^https?:\/\//i.test(offer)) {
    return `${OFFER_SCHEME}?credential_offer_uri=${encodeURIComponent(offer)}`;
  }
  throw new BadRequestException(
    'credentialOffer must be an openid-credential-offer:// link or the https URI of a credential offer'
  );
}

/** The body of the agent's `request-credential` call. Unset options are left out, so the agent defaults apply. */
export function buildRequestCredentialPayload(request: ICloudWalletOid4vcRequestCredential): Record<string, unknown> {
  const { credentialOffer, txCode, credentialsToRequest, holderDidUrl, bindingPolicy, sendNotification } = request;
  return {
    credentialOfferUri: toCredentialOfferLink(credentialOffer),
    ...(txCode && { txCode }),
    ...(credentialsToRequest?.length && { credentialsToRequest }),
    ...(holderDidUrl && { holderDidUrl, bindingPolicy: bindingPolicy ?? 'require' }),
    ...(undefined !== sendNotification && { sendNotification })
  };
}
