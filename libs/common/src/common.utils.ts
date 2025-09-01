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

export const getAgentUrl = async (agentEndPoint: string, urlFlag: string, paramId?: string): Promise<string> => {
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
    [String(CommonConstants.SEND_BASIC_MESSAGE), String(CommonConstants.URL_SEND_BASIC_MESSAGE)]
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
