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

  if (!data?.consentNoticeUrl) {
    throw new Error('consentNoticeUrl is missing in the consent notice response.');
  }

  return data.consentNoticeUrl;
}
