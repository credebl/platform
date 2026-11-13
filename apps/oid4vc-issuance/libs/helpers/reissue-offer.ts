import { X509Certificate } from 'node:crypto';
import { ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { x5cKeyType } from '@credebl/enum/enum';
import { describeIssuanceState } from './issuance-state';
import { checkMdocIssuance } from './mdoc-preflight';

const PRE_AUTHORIZED_GRANT = 'urn:ietf:params:oauth:grant-type:pre-authorized_code';
const MDOC_FORMAT = 'mso_mdoc';
const DEFAULT_VALIDITY_MS = 30 * 24 * 60 * 60 * 1000;

interface StoredCredential {
  credentialSupportedId: string;
  format: string;
  payload: Record<string, unknown> & { validityInfo?: { validFrom?: string; validUntil?: string } };
  signerOptions: { method: string; x5c?: string[]; keyId?: string; did?: string };
}

/** The parts of an issuance session, as the agent keeps them, that issuing again needs. */
export interface IssuanceSessionRecord {
  id: string;
  issuerId: string;
  state: string;
  expiresAt?: string;
  issuanceMetadata?: { credentials?: StoredCredential[]; isRevocable?: boolean };
  credentialOfferPayload?: {
    credential_issuer?: string;
    grants?: Record<string, { tx_code?: Record<string, unknown> }>;
  };
}

export interface ReissueOptions {
  /** The validity of the new mDoc credentials. Defaults to the same length as before, starting now. */
  validityInfo?: { validFrom: string; validUntil: string };
}

/** The request the agent takes to create an offer. */
export interface ReissueRequest {
  publicIssuerId: string;
  credentials: StoredCredential[];
  preAuthorizedCodeFlowConfig: { authorizationServerUrl: string; txCode?: Record<string, unknown> };
}

function newMdocValidity(
  credential: StoredCredential,
  options: ReissueOptions,
  now: Date
): { validFrom: string; validUntil: string } {
  const certificate = credential.signerOptions.x5c?.[0];
  if (!certificate) {
    throw new UnprocessableEntityException(`${credential.credentialSupportedId} has no signing certificate to check.`);
  }
  const { validFrom: certificateFrom, validTo: certificateTo } = new X509Certificate(
    Buffer.from(certificate, 'base64')
  );
  const windowStart = new Date(certificateFrom);
  const windowEnd = new Date(certificateTo);
  if (now < windowStart || now > windowEnd) {
    throw new UnprocessableEntityException(
      'The signing certificate of this offer is not valid now. Import or activate a valid certificate and create a new offer.'
    );
  }

  const previous = credential.payload.validityInfo;
  const previousLength =
    previous?.validFrom && previous?.validUntil
      ? new Date(previous.validUntil).getTime() - new Date(previous.validFrom).getTime()
      : 0;

  const validFrom = options.validityInfo ? new Date(options.validityInfo.validFrom) : now;
  const validUntil = options.validityInfo
    ? new Date(options.validityInfo.validUntil)
    : new Date(
        Math.min(now.getTime() + (0 < previousLength ? previousLength : DEFAULT_VALIDITY_MS), windowEnd.getTime())
      );

  if (validFrom < windowStart || validUntil > windowEnd || validUntil <= validFrom) {
    throw new UnprocessableEntityException(
      `The validity must start and end inside the signing certificate's validity (${windowStart.toISOString()} to ${windowEnd.toISOString()}).`
    );
  }
  return { validFrom: validFrom.toISOString(), validUntil: validUntil.toISOString() };
}

/**
 * Builds the request that creates a new offer for the same credentials as an offer that cannot be used any more, for
 * example because the wallet used its one-time code and then rejected the credential. The stored credentials are
 * reused as they were built; an mDoc gets a new validity, and is checked against its signing certificate again.
 *
 * Only pre-authorized, non-revocable offers can be issued again: a revocable one would need a new status list entry.
 */
export function buildReissueRequest(
  session: IssuanceSessionRecord,
  options: ReissueOptions = {},
  now: Date = new Date()
): ReissueRequest {
  if (describeIssuanceState(session.state, session.expiresAt, now).canBeRedeemed) {
    throw new ConflictException(
      'This offer can still be used by the wallet. Use it, or delete it before creating another one.'
    );
  }
  if (session.issuanceMetadata?.isRevocable) {
    throw new UnprocessableEntityException(
      'A revocable offer cannot be issued again yet. Create a new offer from its template.'
    );
  }

  const stored = session.issuanceMetadata?.credentials;
  if (!stored?.length) {
    throw new NotFoundException('This offer has no credentials to issue again. Create a new offer from its template.');
  }

  const grant = session.credentialOfferPayload?.grants?.[PRE_AUTHORIZED_GRANT];
  if (!grant) {
    throw new UnprocessableEntityException('Only an offer made with a pre-authorized code can be issued again.');
  }

  const credentials = stored.map((credential) => {
    if (MDOC_FORMAT !== credential.format) {
      return credential;
    }

    const validityInfo = newMdocValidity(credential, options, now);
    const payload = { ...credential.payload, validityInfo };
    const problems = checkMdocIssuance(credential.signerOptions.x5c?.[0] ?? '', payload);
    if (0 < problems.length) {
      throw new UnprocessableEntityException(problems.join(' '));
    }
    return { ...credential, payload };
  });

  return {
    publicIssuerId: session.issuerId,
    credentials,
    preAuthorizedCodeFlowConfig: {
      authorizationServerUrl: session.credentialOfferPayload?.credential_issuer ?? '',
      ...(grant.tx_code && { txCode: grant.tx_code })
    }
  };
}

/** The key type of a certificate given as base64 DER, when it is one an X.509 signer can use. */
export function keyTypeOfCertificate(certificateBase64: string): x5cKeyType | undefined {
  try {
    const { publicKey } = new X509Certificate(Buffer.from(certificateBase64, 'base64'));
    if ('ed25519' === publicKey.asymmetricKeyType) {
      return x5cKeyType.Ed25519;
    }
    if ('ec' === publicKey.asymmetricKeyType && 'prime256v1' === publicKey.asymmetricKeyDetails?.namedCurve) {
      return x5cKeyType.P256;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/** The signing certificate of an offer's credential: the leaf first, then the chain that follows it. */
export interface CurrentSigner {
  certificateBase64: string;
  certificateChain?: string[];
  keyId?: string;
}

/**
 * Replaces the X.509 signing details stored with an offer by the current ones. An offer is usually issued again after
 * its cause was fixed, for example with a certificate that carries its chain, so the new offer has to use that
 * certificate and not the one the old offer was built with. Credentials signed another way, and those whose key type
 * has no current certificate, keep what they had.
 */
export async function withCurrentSigners(
  session: IssuanceSessionRecord,
  currentSigner: (keyType: x5cKeyType) => Promise<CurrentSigner | null | undefined>
): Promise<IssuanceSessionRecord> {
  const credentials = session.issuanceMetadata?.credentials;
  if (!credentials) {
    return session;
  }

  const refreshed = await Promise.all(
    credentials.map(async (credential) => {
      const stored = credential.signerOptions?.x5c?.[0];
      const keyType = 'x5c' === credential.signerOptions?.method && stored ? keyTypeOfCertificate(stored) : undefined;
      const signer = keyType ? await currentSigner(keyType) : undefined;
      if (!signer?.keyId) {
        return credential;
      }
      return {
        ...credential,
        signerOptions: {
          ...credential.signerOptions,
          x5c: [signer.certificateBase64, ...(signer.certificateChain ?? [])],
          keyId: signer.keyId
        }
      };
    })
  );

  return { ...session, issuanceMetadata: { ...session.issuanceMetadata, credentials: refreshed } };
}
