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
    [String(CommonConstants.SEND_BASIC_MESSAGE), String(CommonConstants.URL_SEND_BASIC_MESSAGE)],
    [String(CommonConstants.OIDC_ISSUER_CREATE), String(CommonConstants.URL_OIDC_ISSUER_CREATE)],
    [String(CommonConstants.OIDC_ISSUER_TEMPLATE), String(CommonConstants.URL_OIDC_ISSUER_UPDATE)]
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

// ---- Types (adjust or remove if you already have them elsewhere) ----
type AttributeDisplay = { name: string; locale: string };
// type AttributeDef = {
//   display?: AttributeDisplay[];
//   mandatory?: boolean;
//   value_type: "string" | "date" | "number" | "boolean" | string;
// };
// type AttributesInput = Record<string, AttributeDef>;

// type AppearanceItem = {
//   logo?: { uri: string; alt_text?: string };
//   name: string;
//   locale?: string;
//   description?: string;
// };

type CredentialConfig = {
  format: string;
  vct: string;
  scope: string;
  claims: Record<
    string,
    {
      mandatory?: boolean;
      value_type: string;
      display?: AttributeDisplay[];
    }
  >;
  credential_signing_alg_values_supported: string[];
  cryptographic_binding_methods_supported: string[];
  display: {
    name: string;
    description?: string;
    locale?: string;
  }[];
};

type AgentPayload = {
  dpopSigningAlgValuesSupported: string[];
  credentialConfigurationsSupported: Record<string, CredentialConfig>;
};

// ---- Static Lists (as requested) ----
const STATIC_DPOP_ALGS = ['RS256', 'ES256', 'EdDSA'] as const;
const STATIC_CREDENTIAL_ALGS = ['ES256', 'EdDSA'] as const;
const STATIC_BINDING_METHODS = ['did:key', 'did:web', 'did:cheqd'] as const;

// ---- Builder ----
/**
 * Build the agent payload for an SD-JWT VCT.
 *
 * @param name       e.g. "BirthCertificateCredential" (used as VCT and to derive scope/key)
 * @param attributes Input claims definition map (only `mandatory: true` will be included)
 * @param appearance Array for credential display (mapped to name/description/locale)
 * @param opts       Optional { format?, scope? }
 */
export function buildAgentPayload(
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attributes: any, //AttributesInput, TODO: correct this
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appearance: any, //AppearanceItem[],
  opts?: { format?: string; scope?: string }
): AgentPayload {
  if (!name || 'string' !== typeof name) {
    throw new Error('Invalid input: `name` must be a non-empty string.');
  }
  if (!attributes || 'object' !== typeof attributes) {
    throw new Error('Invalid input: `attributes` must be an object map.');
  }

  const format = opts?.format ?? 'vc+sd-jwt';
  const credKey = `${name}-sdjwt`;
  const scope = opts?.scope ?? `openid4vc:credential:${credKey}`;

  // Keep ONLY mandatory claims, and map to the required shape
  const claims = Object.fromEntries(
    Object.entries(attributes)
      .filter(([, def]) => true === def?.mandatory)
      .map(([claimName, def]) => {
        const out: { mandatory?: boolean; value_type: string; display?: AttributeDisplay[] } = {
          value_type: def.value_type,
          mandatory: true
        };

        if (Array.isArray(def.display)) {
          out.display = def.display.map((d) => ({
            name: d.name,
            locale: d.locale
          }));
        }
        return [claimName, out];
      })
  );

  // Map appearance -> display (omit logo here as per target payload)
  const credentialDisplay =
    appearance?.map((d) => ({
      name: d.name,
      description: d.description,
      locale: d.locale
    })) ?? [];

  // Assemble final payload
  const payload: AgentPayload = {
    dpopSigningAlgValuesSupported: [...STATIC_DPOP_ALGS],
    credentialConfigurationsSupported: {
      [credKey]: {
        format,
        vct: name,
        scope,
        claims,
        credential_signing_alg_values_supported: [...STATIC_CREDENTIAL_ALGS],
        cryptographic_binding_methods_supported: [...STATIC_BINDING_METHODS],
        display: credentialDisplay
      }
    }
  };

  return payload;
}

// ---- Example usage ----
// const name = "BirthCertificateCredential";
// const attributes = { ... }  // your sample map
// const appearance = [ ... ]  // your sample array
// const payload = buildAgentPayload(name, attributes, appearance);
// console.log(JSON.stringify(payload, null, 2));
