/* eslint-disable camelcase */
import { DID_URL_PATTERN } from './binding.constants';
import { PrimaryDidPreference } from './binding.types';

/** Platform preference endpoints from design spec 5.2 (canonical contract is not changed here). */
export const PRIMARY_DID_ENDPOINT_TEMPLATE = '/orgs/{orgId}/users/{userId}/oid4vc/holder/primary-did';

type HttpGet = (url: string, config?: { headers?: Record<string, string> }) => Promise<unknown>;

export function buildPrimaryDidPath(orgId: string, userId: string): string {
  return PRIMARY_DID_ENDPOINT_TEMPLATE.replace('{orgId}', encodeURIComponent(orgId)).replace(
    '{userId}',
    encodeURIComponent(userId)
  );
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && 'object' === typeof value && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

/**
 * Read a primary DID preference from a platform response, including the API response envelope.
 * A 204/no-content response is simply `null`. Only the DID URL and tenant id are retained:
 * no full DID list, proof JWT or tx code is logged or returned to the fresh-key branch.
 */
export function normalizePrimaryDidResponse(response: unknown): PrimaryDidPreference | null {
  const envelope = asRecord(response);
  if (!envelope) {
    return null;
  }
  const data = asRecord(envelope.data) ?? envelope;
  const preference = asRecord(data.primaryDid) ?? data;
  const { didUrl } = preference;

  if ('string' !== typeof didUrl || !DID_URL_PATTERN.test(didUrl)) {
    return null;
  }

  const { holderTenantId } = preference;
  return {
    didUrl,
    ...('string' === typeof holderTenantId && holderTenantId ? { holderTenantId } : {})
  };
}

/** Fetch the preference so the UI can offer it as a suggestion, never as an automatic binding. */
export async function fetchPrimaryDidPreference(
  baseUrl: string,
  orgId: string,
  userId: string,
  httpGet: HttpGet,
  headers?: Record<string, string>
): Promise<PrimaryDidPreference | null> {
  const url = `${baseUrl.replace(/\/$/, '')}${buildPrimaryDidPath(orgId, userId)}`;
  const response = await httpGet(url, headers ? { headers } : undefined);
  return normalizePrimaryDidResponse(response);
}

/**
 * A platform suggestion is only usable when the DID is present in the holder tenant's DID list.
 * The caller still has to opt in to the existing-DID option before it is submitted.
 */
export function suggestPrimaryDid(
  preference: PrimaryDidPreference | null | undefined,
  holderDids: readonly string[]
): string | undefined {
  return preference && holderDids.includes(preference.didUrl) ? preference.didUrl : undefined;
}
