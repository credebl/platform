/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { oidc_issuer, Prisma } from '@prisma/client';
import { batchCredentialIssuanceDefault } from '../../constant/issuance';
import { CreateOidcCredentialOffer } from '../../interfaces/oid4vc-issuer-sessions.interfaces';
import { IssuerResponse } from 'apps/oid4vc-issuance/interfaces/oid4vc-issuance.interfaces';

type AttributeDisplay = { name: string; locale: string };
type AttributeDef = {
  display?: AttributeDisplay[];
  mandatory?: boolean;
  value_type: 'string' | 'date' | 'number' | 'boolean' | string;
};
type AttributesMap = Record<string, AttributeDef>;

type CredentialDisplayItem = {
  logo?: { uri: string; alt_text?: string };
  name: string;
  locale?: string;
  description?: string;
};
type Appearance = {
  display: CredentialDisplayItem[];
};

type Claim = {
  mandatory?: boolean;
  // value_type: string;
  path: string[];
  display?: AttributeDisplay[];
};

type CredentialConfig = {
  format: string;
  vct?: string;
  scope: string;
  doctype?: string;
  claims: Claim[];
  credential_signing_alg_values_supported: string[];
  cryptographic_binding_methods_supported: string[];
  display: { name: string; description?: string; locale?: string }[];
};

type CredentialConfigurationsSupported = {
  credentialConfigurationsSupported: Record<string, CredentialConfig>;
};

// ---- Static Lists (as requested) ----
const STATIC_CREDENTIAL_ALGS = ['ES256', 'EdDSA'] as const;
const STATIC_BINDING_METHODS = ['did:key'] as const;

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
  return x && 'object' === typeof x && Array.isArray((x as any).display);
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
export function buildCredentialConfigurationsSupported(
  templates: TemplateRowPrisma[],
  opts?: {
    vct?: string;
    doctype?: string;
    scopeVct?: string;
    keyResolver?: (t: TemplateRowPrisma) => string;
    format?: string;
  }
): CredentialConfigurationsSupported {
  const defaultFormat = opts?.format ?? 'vc+sd-jwt';
  const credentialConfigurationsSupported: Record<string, CredentialConfig> = {};
  for (const t of templates) {
    const attrs = coerceJsonObject<unknown>(t.attributes);
    const app = coerceJsonObject<unknown>(t.appearance);

    if (!isAttributesMap(attrs)) {
      throw new Error(`Template ${t.id}: invalid attributes JSON`);
    }
    if (!isAppearance(app)) {
      throw new Error(`Template ${t.id}: invalid appearance JSON (missing display)`);
    }

    // per-row format (allow column override)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rowFormat: string = (t as any).format ?? defaultFormat;
    const isMdoc = 'mso_mdoc' === rowFormat;
    const suffix = isMdoc ? 'mdoc' : 'sdjwt';
    const key = 'function' === typeof opts?.keyResolver ? opts.keyResolver(t) : `${t.name}-${suffix}`;

    // key: keep your keyResolver override; otherwise include suffix
    // const key = 'function' === typeof opts?.keyResolver ? opts.keyResolver(t) : `${t.name}-${suffix}`;

    // Resolve doctype/vct:
    // - For mdoc: try opts.doctype -> t.doctype -> fallback to t.name (or throw if you prefer)
    // - For sd-jwt: try opts.vct -> t.vct -> fallback to t.name
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rowDoctype: string | undefined = opts?.doctype ?? (t as any).doctype;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rowVct: string = opts?.vct ?? (t as any).vct ?? t.name;

    if (isMdoc) {
      if (!rowDoctype) {
        // Fallback strategy: use template's name as doctype (change to throw if you want strictness)
        rowDoctype = t.name;
        // If you want to fail instead of fallback, uncomment next line:
        // throw new Error(`Template ${t.id}: doctype is required for mdoc format`);
      }
    }

    // Choose scope base: prefer opts.scopeVct, otherwise for mdoc use doctype, else vct
    const scopeBase = opts?.scopeVct ?? (isMdoc ? rowDoctype : rowVct);
    const scope = `openid4vc:credential:${scopeBase}-${suffix}`;
    const claims = Object.entries(attrs).map(([claimName, def]) => {
      const d = def as AttributeDef;
      return {
        path: [claimName],
        // value_type: d.value_type,    // Didn't find this in draft 15
        mandatory: d.mandatory ?? false, // always include, default to false
        display: Array.isArray(d.display) ? d.display.map((x) => ({ name: x.name, locale: x.locale })) : undefined
      };
    });

    const display =
      app.display?.map((d) => ({
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
      ...(isMdoc ? { doctype: rowDoctype as string } : { vct: rowVct })
    };
  }

  return { credentialConfigurationsSupported };
}

// Default DPoP list for issuer-level metadata (match your example)
const ISSUER_DPOP_ALGS_DEFAULT = ['RS256', 'ES256'] as const;

// ---------- Safe coercion ----------
function coerceJson<T>(v: Prisma.JsonValue): T | null {
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
  return v as unknown as T;
}

type DisplayItem = {
  name: string;
  locale?: string;
  description?: string;
  logo?: { uri: string; alt_text?: string };
};

function isDisplayArray(x: unknown): x is DisplayItem[] {
  return (
    Array.isArray(x) &&
    x.every(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (i) => i && 'object' === typeof i && 'string' === typeof (i as any).name
    )
  );
}

// ---------- Builder you asked for ----------
/**
 * Build issuer metadata payload from issuer row + credential configurations.
 *
 * @param credentialConfigurations Object with credentialConfigurationsSupported (from your template builder)
 * @param oidcIssuer               OID4VC issuer row (uses publicIssuerId and metadata -> display)
 * @param opts                     Optional overrides: dpopAlgs[], accessTokenSignerKeyType
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function buildIssuerPayload(
  credentialConfigurations: CredentialConfigurationsSupported | Record<string, any> | null | undefined,
  oidcIssuer: oidc_issuer,
  opts?: {
    dpopAlgs?: string[];
    accessTokenSignerKeyType?: string;
  }
) {
  if (!oidcIssuer?.publicIssuerId || 'string' !== typeof oidcIssuer.publicIssuerId) {
    throw new Error('Invalid issuer: missing publicIssuerId');
  }

  const rawDisplay = coerceJson<unknown>(oidcIssuer.metadata);
  const display: DisplayItem[] = isDisplayArray(rawDisplay) ? rawDisplay : [];

  // Accept both shapes:
  // 1) { credentialConfigurationsSupported: Record<string, CredentialConfig> }
  // 2) directly the Record<string, CredentialConfig>
  let credentialConfigMap: Record<string, unknown> = {};
  if (!credentialConfigurations) {
    credentialConfigMap = {};
  } else if ('credentialConfigurationsSupported' in (credentialConfigurations as any)) {
    credentialConfigMap = (credentialConfigurations as any).credentialConfigurationsSupported ?? {};
  } else {
    credentialConfigMap = credentialConfigurations as Record<string, unknown>;
  }

  return {
    display,
    dpopSigningAlgValuesSupported: opts?.dpopAlgs ?? [...ISSUER_DPOP_ALGS_DEFAULT],
    credentialConfigurationsSupported: credentialConfigMap,
    batchCredentialIssuance: {
      batchSize: oidcIssuer?.batchCredentialIssuanceSize ?? batchCredentialIssuanceDefault
    }
  };
}

export function extractTemplateIds(offer: CreateOidcCredentialOffer): string[] {
  if (!offer?.credentials || !Array.isArray(offer.credentials)) {
    return [];
  }

  return offer.credentials.map((c) => c.templateId).filter((id): id is string => Boolean(id));
}

export function normalizeJson(input: unknown): IssuerResponse {
  if ('string' === typeof input) {
    return JSON.parse(input) as IssuerResponse;
  }
  if (input && 'object' === typeof input) {
    return input as IssuerResponse;
  }
  throw new Error('Expected a JSON object or JSON string');
}

export function encodeIssuerPublicId(publicIssuerId: string): string {
  if (!publicIssuerId) {
    throw new Error('issuerPublicId is required');
  }
  return encodeURIComponent(publicIssuerId.trim());
}
