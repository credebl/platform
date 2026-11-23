import {
  Oid4vpVerificationSessionResult,
  Oid4vpVerificationStatus,
  OpenId4VcVerificationPresentationState
} from '@credebl/common/interfaces/oid4vp-verification';

export function buildVerificationSessionResult(
  session: Record<string, unknown> | null | undefined,
  state?: string | null,
  errorMessage?: string | null
): Oid4vpVerificationSessionResult {
  const source = session ?? {};
  const sessionState =
    state ?? (source.state as string | undefined) ?? (source.responseStatus as string | undefined) ?? null;
  const error =
    errorMessage ?? (source.errorMessage as string | undefined) ?? (source.error as string | undefined) ?? null;

  let verificationStatus: Oid4vpVerificationStatus = 'pending';
  if (OpenId4VcVerificationPresentationState.ResponseVerified === sessionState) {
    verificationStatus = 'verified';
  } else if (OpenId4VcVerificationPresentationState.Error === sessionState) {
    verificationStatus = 'failed';
  }

  return {
    ...source,
    responseStatus: sessionState,
    verificationStatus,
    verified: 'verified' === verificationStatus,
    error: error ?? null
  };
}

export async function fetchConsentNotice(noticeUrl: string, transactionId: string): Promise<string> {
  if (!noticeUrl?.trim() || !transactionId?.trim()) {
    throw new Error('noticeUrl and transactionId are required and must not be empty.');
  }

  const consentNoticeUrl = `${noticeUrl}?transactionId=${transactionId}`;

  const response = await fetch(consentNoticeUrl);
  if (!response.ok) {
    throw new Error(`consentNoticeUrl is not reachable (HTTP ${response.status}).`);
  }

  const data = await response.json();

  if (!data?.consent_notice?.consentNoticeUrl) {
    throw new Error('consentNoticeUrl is missing in the consent notice response.');
  }

  return data.consent_notice.consentNoticeUrl;
}
