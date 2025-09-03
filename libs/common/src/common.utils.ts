import { NotFoundException } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { ResponseMessages } from './response-messages';
import { CommonConstants } from './common.constant';
import type { Prisma } from '@prisma/client';
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

// ---- Optional: import Prisma type if you’ll use the Prisma-specific builder ----

// ========================= Shared Domain Types =========================
type AttributeDisplay = { name: string; locale: string };
type AttributeDef = {
  display?: AttributeDisplay[];
  mandatory?: boolean;
  value_type: 'string' | 'date' | 'number' | 'boolean' | string;
};
type AttributesInput = Record<string, AttributeDef>;
type AttributesMap = Record<string, AttributeDef>;

type CredentialDisplayItem = {
  logo?: { uri: string; alt_text?: string };
  name: string;
  locale?: string;
  description?: string;
};
type Appearance = {
  credential_display: CredentialDisplayItem[];
};

type CredentialConfig = {
  format: string;
  vct?: string;
  scope: string;
  doctype?: string;
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
  display: { name: string; description?: string; locale?: string }[];
};

type AgentPayload = {
  dpopSigningAlgValuesSupported: string[];
  credentialConfigurationsSupported: Record<string, CredentialConfig>;
};

// ---- Static Lists (as requested) ----
const STATIC_DPOP_ALGS = ['RS256', 'ES256', 'EdDSA'] as const;
const STATIC_CREDENTIAL_ALGS = ['ES256', 'EdDSA'] as const;
const STATIC_BINDING_METHODS = ['did:key', 'did:web', 'did:cheqd'] as const;
const DOCTYPE = 'org.iso.18013.5.1'; // for mso_mdoc format
const MSO_MDOC = 'mso_mdoc'; // alternative format value

// ========================= Builder #1: Single template (inputs already typed) =========================
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
  attributes: AttributesInput,
  appearance: CredentialDisplayItem[],
  opts?: { format?: string; scope?: string }
): AgentPayload {
  if (!name || 'string' !== typeof name) {
    throw new Error('Invalid input: `name` must be a non-empty string.');
  }
  if (!attributes || 'object' !== typeof attributes) {
    throw new Error('Invalid input: `attributes` must be an object map.');
  }

  const format = opts?.format ?? 'vc+sd-jwt';
  const credKey = format === `${MSO_MDOC}` ? `${name}-mdoc` : `${name}-sdjwt`;

  const scope = opts?.scope ?? `openid4vc:credential:${name}-${format === `${MSO_MDOC}` ? 'mdoc' : 'sdjwt'}`;

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
  return {
    dpopSigningAlgValuesSupported: [...STATIC_DPOP_ALGS],
    credentialConfigurationsSupported: {
      [credKey]: {
        format,
        scope,
        claims,
        credential_signing_alg_values_supported: [...STATIC_CREDENTIAL_ALGS],
        cryptographic_binding_methods_supported: [...STATIC_BINDING_METHODS],
        display: credentialDisplay,
        ...(format === `${MSO_MDOC}` ? { doctype: `${DOCTYPE}` } : { vct: name })
      }
    }
  };
}

// ========================= Prisma Helpers + Builder #3 (accepts JsonValue) =========================
// Use these only if your repository returns Prisma.JsonValue for attributes/appearance

// Safe coercion helpers
function coerceJsonObject<T>(v: Prisma.JsonValue): T | null {
  if (null == v) {
    return null;
  }
  if ('string' === typeof v) {
    try {
      return JSON.parse(v) as T;
    } catch {
      return null;
    }
  }
  return v as unknown as T; // already a JsonObject/JsonArray
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isAttributesMap(x: any): x is AttributesMap {
  return x && 'object' === typeof x && !Array.isArray(x);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isAppearance(x: any): x is Appearance {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return x && 'object' === typeof x && Array.isArray((x as any).credential_display);
}

// Prisma row shape
type TemplateRowPrisma = {
  id: string;
  name: string;
  description?: string | null;
  format?: string | null;
  canBeRevoked?: boolean | null;
  attributes: Prisma.JsonValue; // JsonValue from DB
  appearance: Prisma.JsonValue; // JsonValue from DB
  issuerId: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

/**
 * Build agent payload from Prisma rows (attributes/appearance are Prisma.JsonValue).
 * Safely coerces JSON and then builds the same structure as Builder #2.
 */
export function buildAgentPayloadFromPrismaTemplates(
  templates: TemplateRowPrisma[],
  opts?: {
    vct?: string; // e.g., "BirthCertificateCredential"
    scopeVct?: string; // used in scope
    keyResolver?: (t: TemplateRowPrisma) => string; // customize config key
    format?: string; // default "vc+sd-jwt"
  }
): AgentPayload {
  const format = opts?.format ?? 'vc+sd-jwt';
  const credentialConfigurationsSupported: Record<string, CredentialConfig> = {};

  for (const t of templates) {
    // Coerce JSON fields
    const attrs = coerceJsonObject<unknown>(t.attributes);
    const app = coerceJsonObject<unknown>(t.appearance);

    if (!isAttributesMap(attrs)) {
      throw new Error(`Template ${t.id}: invalid attributes JSON`);
    }
    if (!isAppearance(app)) {
      throw new Error(`Template ${t.id}: invalid appearance JSON (missing credential_display)`);
    }

    // ---- dynamic format per row ----
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rowFormat = (t as any).format ?? format;
    const suffix = rowFormat === `${MSO_MDOC}` ? 'mdoc' : 'sdjwt';

    // key: keep your keyResolver override; otherwise include suffix
    const key = 'function' === typeof opts?.keyResolver ? opts.keyResolver(t) : `${t.name}-${suffix}`;

    // vct/scope: vct only for non-mdoc; scope always uses suffix
    const vct = opts?.vct ?? t.name;
    const scopeBase = opts?.scopeVct ?? vct;
    const scope = `openid4vc:credential:${scopeBase}-${suffix}`;

    // claims: only mandatory
    const claims = Object.fromEntries(
      Object.entries(attrs)
        .filter(([, def]) => true === (def as AttributeDef)?.mandatory)
        .map(([claimName, def]) => {
          const d = def as AttributeDef;
          return [
            claimName,
            {
              value_type: d.value_type,
              mandatory: true,
              display: Array.isArray(d.display) ? d.display.map((x) => ({ name: x.name, locale: x.locale })) : undefined
            }
          ];
        })
    );

    const display =
      app.credential_display.map((d) => ({
        name: d.name,
        description: d.description,
        locale: d.locale
      })) ?? [];

    // assemble per-template config
    credentialConfigurationsSupported[key] = {
      format: rowFormat,
      scope,
      claims,
      credential_signing_alg_values_supported: [...STATIC_CREDENTIAL_ALGS],
      cryptographic_binding_methods_supported: [...STATIC_BINDING_METHODS],
      display,
      ...(rowFormat === `${MSO_MDOC}`
        ? { doctype: `${DOCTYPE}` } // static for mdoc
        : { vct }) // keep vct only for non-mdoc
    };
  }

  return {
    dpopSigningAlgValuesSupported: [...STATIC_DPOP_ALGS],
    credentialConfigurationsSupported
  };
}
