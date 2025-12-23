import { NotFoundException } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { ResponseMessages } from './response-messages';
import { CommonConstants } from './common.constant';
dotenv.config();
/* eslint-disable camelcase */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/explicit-function-return-type
export function paginator<T>(items: T[], current_page: number, items_per_page: number) {
  const page: number = Number(current_page) || 1;
  const per_page: number = Number(items_per_page) || 10;
  const offset: number = (page - 1) * per_page;
  const paginatedItems = items.slice(offset, offset + per_page);
  const total_pages: number = Math.ceil(items.length / per_page);

  const previousPage: number | null = 1 < page ? page - 1 : null;
  const nextPage: number | null = page < total_pages ? page + 1 : null;
  return {
    page,
    pageSize: per_page,
    previousPage,
    nextPage,
    totalItems: items.length,
    lastPage: total_pages,
    data: paginatedItems
  };
}

export function orderValues(key, order = 'asc') {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
  return function innerSort(a, b) {
    if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
      // property doesn't exist on either object
      return 0;
    }

    const varA = 'string' === typeof a[key] ? a[key].toUpperCase() : a[key];
    const varB = 'string' === typeof b[key] ? b[key].toUpperCase() : b[key];

    let comparison = 0;
    if (varA > varB) {
      comparison = 1;
    } else if (varA < varB) {
      comparison = -1;
    }
    return 'desc' === order ? comparison * -1 : comparison;
  };
}

export function convertUrlToDeepLinkUrl(url: string): string {
  const deepLinkDomain = process.env.DEEPLINK_DOMAIN;
  if (!deepLinkDomain) {
    throw new NotFoundException(ResponseMessages.shorteningUrl.error.deepLinkDomainNotFound);
  }
  const deepLinkUrl = deepLinkDomain.concat(url);
  return deepLinkUrl;
}

export const networkNamespace = (did: string): string => {
  // Split the DID into segments using the colon as a delimiter
  const segments = did.split(':');
  const hasPolygon = segments.some((segment) => segment.includes(CommonConstants.POLYGON));
  const hasTestnet = segments.some((segment) => segment.includes(CommonConstants.TESTNET));
  if (hasPolygon) {
    return hasTestnet ? `${segments[1]}:${segments[2]}` : `${segments[1]}:${CommonConstants.MAINNET}`;
  }

  return segments[1];
};

//TODO: Remove this util method because we can have some better way to manage agent URLs
export const getAgentUrl = (agentEndPoint: string, urlFlag: string, paramId?: string): string => {
  if (!agentEndPoint) {
    throw new NotFoundException(ResponseMessages.common.error.invalidEndpoint);
  }
  const agentUrlMap: Map<string, string> = new Map<string, string>([
    [String(CommonConstants.CONNECTION_INVITATION), String(CommonConstants.URL_CONN_INVITE)],
    [String(CommonConstants.LEGACY_INVITATION), String(CommonConstants.URL_CONN_LEGACY_INVITE)],
    [String(CommonConstants.SIGN_DATA_FROM_AGENT), String(CommonConstants.URL_AGENT_SIGN_DATA)],
    [String(CommonConstants.VERIFY_SIGNED_DATA_FROM_AGENT), String(CommonConstants.URL_AGENT_VERIFY_SIGNED_DATA)],
    [String(CommonConstants.CREATE_OFFER), String(CommonConstants.URL_ISSUANCE_CREATE_OFFER)],
    [String(CommonConstants.CREATE_OFFER_OUT_OF_BAND), String(CommonConstants.URL_OUT_OF_BAND_CREDENTIAL_OFFER)],
    [String(CommonConstants.GET_OFFER_BY_CRED_ID), String(CommonConstants.URL_ISSUE_GET_CREDS_BY_CRED_REC_ID)],
    [
      String(CommonConstants.URL_GET_PROOF_PRESENTATION_BY_ID_FLAG),
      String(CommonConstants.URL_GET_PROOF_PRESENTATION_BY_ID)
    ],
    [String(CommonConstants.REQUEST_PROOF), String(CommonConstants.URL_SEND_PROOF_REQUEST)],
    [String(CommonConstants.ACCEPT_PRESENTATION), String(CommonConstants.URL_ACCEPT_PRESENTATION)],
    [
      String(CommonConstants.CREATE_OUT_OF_BAND_PROOF_PRESENTATION),
      String(CommonConstants.URL_CREATE_OUT_OF_BAND_CREATE_REQUEST)
    ],
    [String(CommonConstants.GET_VERIFIED_PROOF), String(CommonConstants.URL_PROOF_FORM_DATA)],
    [String(CommonConstants.GET_QUESTION_ANSWER_RECORD), String(CommonConstants.URL_QUESTION_ANSWER_RECORD)],
    [String(CommonConstants.SEND_QUESTION), String(CommonConstants.URL_SEND_QUESTION)],
    [String(CommonConstants.SEND_BASIC_MESSAGE), String(CommonConstants.URL_SEND_BASIC_MESSAGE)],
    [String(CommonConstants.OIDC_ISSUER_CREATE), String(CommonConstants.URL_OIDC_ISSUER_CREATE)],
    [String(CommonConstants.OIDC_GET_ALL_ISSUERS), String(CommonConstants.URL_OIDC_GET_ISSUERS)],
    [String(CommonConstants.OIDC_ISSUER_DELETE), String(CommonConstants.URL_OIDC_ISSUER_UPDATE)],
    [String(CommonConstants.OIDC_ISSUER_BY_ID), String(CommonConstants.URL_OIDC_ISSUER_UPDATE)],
    [String(CommonConstants.OIDC_ISSUER_TEMPLATE), String(CommonConstants.URL_OIDC_ISSUER_UPDATE)],
    [
      String(CommonConstants.OIDC_ISSUER_SESSIONS_CREDENTIAL_OFFER),
      String(CommonConstants.URL_OIDC_ISSUER_SESSIONS_CREATE)
    ],
    [String(CommonConstants.OIDC_ISSUER_SESSIONS_UPDATE_OFFER), String(CommonConstants.URL_OIDC_ISSUER_SESSIONS_GET)],
    [String(CommonConstants.OIDC_ISSUER_SESSIONS_BY_ID), String(CommonConstants.URL_OIDC_ISSUER_SESSIONS_GET)],
    [String(CommonConstants.OIDC_ISSUER_SESSIONS), String(CommonConstants.URL_OIDC_ISSUER_SESSIONS_GET_ALL)],
    [String(CommonConstants.OIDC_DELETE_CREDENTIAL_OFFER), String(CommonConstants.URL_OIDC_ISSUER_SESSIONS_GET_ALL)],
    [String(CommonConstants.X509_CREATE_CERTIFICATE), String(CommonConstants.URL_CREATE_X509_CERTIFICATE)],
    [String(CommonConstants.X509_DECODE_CERTIFICATE), String(CommonConstants.URL_DECODE_X509_CERTIFICATE)],
    [String(CommonConstants.X509_IMPORT_CERTIFICATE), String(CommonConstants.URL_IMPORT_X509_CERTIFICATE)],
    [String(CommonConstants.OIDC_VERIFIER_CREATE), String(CommonConstants.URL_OIDC_VERIFIER_CREATE)],
    [String(CommonConstants.OIDC_VERIFIER_UPDATE), String(CommonConstants.URL_OIDC_VERIFIER_UPDATE)],
    [String(CommonConstants.OIDC_VERIFIER_DELETE), String(CommonConstants.URL_OIDC_VERIFIER_DELETE)],
    [
      String(CommonConstants.OIDC_VERIFIER_SESSION_GET_BY_ID),
      String(CommonConstants.URL_OIDC_VERIFIER_SESSION_GET_BY_ID)
    ],
    [
      String(CommonConstants.OIDC_VERIFIER_SESSION_GET_BY_QUERY),
      String(CommonConstants.URL_OIDC_VERIFIER_SESSION_GET_BY_QUERY)
    ],
    [
      String(CommonConstants.OIDC_VERIFIER_SESSION_RESPONSE_GET_BY_ID),
      String(CommonConstants.URL_OIDC_VERIFIER_SESSION_RESPONSE_GET_BY_ID)
    ],
    [String(CommonConstants.OID4VP_VERIFICATION_SESSION), String(CommonConstants.URL_OID4VP_VERIFICATION_SESSION)]
  ]);

  const urlSuffix = agentUrlMap.get(urlFlag);

  if (!urlSuffix) {
    throw new NotFoundException(ResponseMessages.common.error.invalidUrl);
  }
  // Add paramId as a path parameter if provided
  const resolvedUrlPath = paramId ? urlSuffix.replace('#', paramId) : urlSuffix;

  const url = `${agentEndPoint}${resolvedUrlPath}`;
  return url;
};

export function shouldLoadOidcModules(): boolean {
  const raw = process.env.HIDE_EXPERIMENTAL_OIDC_CONTROLLERS ?? 'true';
  const hide = 'true' === raw.toLowerCase();
  return !hide;
}

export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\//g, '&#x2F;');
