/**
 * What a credential offer's state means for a person, as the agent reports it. The agent's state names describe its
 * own steps; this turns them into what an issuer needs to know: where the offer is, whether the wallet can still use
 * it, and whether the issuer needs to create a new one.
 */
export interface IssuanceStatus {
  /** The agent's state, unchanged. */
  code: string;
  label: string;
  description: string;
  /** Whether a wallet can still redeem this offer. A pre-authorized code works once. */
  canBeRedeemed: boolean;
  /** Whether the issuer would have to create a new offer for the wallet to receive the credential. */
  needsNewOffer: boolean;
}

interface StateText {
  label: string;
  description: string;
  canBeRedeemed: boolean;
  needsNewOffer: boolean;
}

const STATES: Record<string, StateText> = {
  OfferCreated: {
    label: 'Waiting for the wallet',
    description: 'The offer is ready and has not been opened yet.',
    canBeRedeemed: true,
    needsNewOffer: false
  },
  OfferUriRetrieved: {
    label: 'Opened by the wallet',
    description: 'The wallet opened the offer but has not been issued a credential yet. It can still be used.',
    canBeRedeemed: true,
    needsNewOffer: false
  },
  AuthorizationInitiated: {
    label: 'Wallet is signing in',
    description: 'The wallet started the authorization step.',
    canBeRedeemed: true,
    needsNewOffer: false
  },
  AuthorizationGranted: {
    label: 'Wallet signed in',
    description: 'The wallet is authorized and has not asked for the credential yet.',
    canBeRedeemed: true,
    needsNewOffer: false
  },
  AccessTokenRequested: {
    label: 'Wallet is requesting access',
    description: 'The wallet is exchanging the offer for an access token.',
    canBeRedeemed: true,
    needsNewOffer: false
  },
  AccessTokenCreated: {
    label: 'Wallet authorised, no credential issued',
    description:
      'The wallet exchanged the code of the offer for an access token, which works only once. If the wallet failed after this point, no credential was issued and the offer cannot be used again: create a new offer.',
    canBeRedeemed: false,
    needsNewOffer: true
  },
  CredentialRequestReceived: {
    label: 'Issuing the credential',
    description: 'The wallet has asked for the credential and the issuer is preparing it.',
    canBeRedeemed: false,
    needsNewOffer: false
  },
  CredentialsPartiallyIssued: {
    label: 'Partly issued',
    description: 'Some of the offered credentials have been issued and the rest are still to be requested.',
    canBeRedeemed: false,
    needsNewOffer: false
  },
  Completed: {
    label: 'Credential sent to the wallet',
    description:
      'The issuer signed the credential and sent it. Whether the wallet accepted it is not reported back, so the wallet may still have refused it, for example because it does not trust the signing certificate. If it did, create a new offer.',
    canBeRedeemed: false,
    needsNewOffer: false
  },
  Error: {
    label: 'Issuing failed',
    description:
      'The issuer could not issue the credential, so the offer cannot be used. Fix the cause, then create a new offer.',
    canBeRedeemed: false,
    needsNewOffer: true
  }
};

const EXPIRABLE = new Set(['OfferCreated', 'OfferUriRetrieved', 'AuthorizationInitiated', 'AuthorizationGranted']);

/**
 * The status of an offer from its state and expiry. An offer that was never redeemed and is past its expiry is
 * reported as expired. A state this does not know is passed through with its code as the label.
 */
export function describeIssuanceState(
  state: string,
  expiresAt?: string | Date,
  now: Date = new Date()
): IssuanceStatus {
  if (EXPIRABLE.has(state) && expiresAt && new Date(expiresAt) < now) {
    return {
      code: state,
      label: 'Expired',
      description: 'The offer expired before the wallet used it. Create a new offer.',
      canBeRedeemed: false,
      needsNewOffer: true
    };
  }

  const text = STATES[state];
  return {
    code: state,
    label: text?.label ?? state,
    description: text?.description ?? 'This state is not described.',
    canBeRedeemed: text?.canBeRedeemed ?? false,
    needsNewOffer: text?.needsNewOffer ?? false
  };
}

interface SessionLike {
  state?: string;
  expiresAt?: string | Date;
  status?: IssuanceStatus;
}

function addStatus(session: SessionLike): SessionLike {
  if (session && 'string' === typeof session.state) {
    return { ...session, status: describeIssuanceState(session.state, session.expiresAt) };
  }
  return session;
}

/** Adds a readable `status` to an issuance session, or to every session of a list. Other shapes are left alone. */
export function withIssuanceStatus(sessions: unknown): unknown {
  if (Array.isArray(sessions)) {
    return sessions.map(addStatus);
  }
  return addStatus(sessions as SessionLike);
}
