// builder/credential-offer.builder.ts
/* eslint-disable @typescript-eslint/naming-convention, @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types, camelcase */
import { Prisma, credential_templates } from '@prisma/client';
import { GetAllCredentialOffer, SignerOption } from '../../interfaces/oid4vc-issuer-sessions.interfaces';
/* ============================================================================
   Domain Types
============================================================================ */

type ValueType = 'string' | 'date' | 'number' | 'boolean' | string;

interface TemplateAttribute {
  display: { name: string; locale: string }[];
  mandatory: boolean;
  value_type: ValueType;
}
type TemplateAttributes = Record<string, TemplateAttribute>;

export enum CredentialFormat {
  SdJwtVc = 'vc+sd-jwt',
  Mdoc = 'mdoc'
}

export enum SignerMethodOption {
  DID = 'did',
  X5C = 'x5c'
}

export type DisclosureFrame = Record<string, boolean | Record<string, boolean>>;

export interface CredentialRequestDtoLike {
  /** maps to credential_templates.id (the template to use) */
  templateId: string;
  /** per-template claims */
  payload: Record<string, unknown>;
  /** optional selective disclosure map */
  disclosureFrame?: DisclosureFrame;
}

export interface CreateOidcCredentialOfferDtoLike {
  credentials: CredentialRequestDtoLike[];

  // Exactly one of the two must be provided (XOR)
  preAuthorizedCodeFlowConfig?: {
    txCode: { description?: string; length: number; input_mode: 'numeric' | 'text' | 'alphanumeric' };
    authorizationServerUrl: string;
  };
  authorizationCodeFlowConfig?: {
    authorizationServerUrl: string;
  };

  // NOTE: issuerId is intentionally NOT emitted in the final payload
  publicIssuerId?: string;
}

export interface ResolvedSignerOption {
  method: 'did' | 'x5c';
  did?: string;
  x5c?: string[];
}

/* ============================================================================
   Strong return types
============================================================================ */

export interface BuiltCredential {
  /** e.g., "BirthCertificateCredential-sdjwt" or "DrivingLicenseCredential-mdoc" */
  credentialSupportedId: string;
  signerOptions?: ResolvedSignerOption;
  /** Derived from template.format ("vc+sd-jwt" | "mdoc") */
  format: CredentialFormat;
  /** User-provided payload (validated, with vct removed) */
  payload: Record<string, unknown>;
  /** Optional disclosure frame (usually for SD-JWT) */
  disclosureFrame?: DisclosureFrame;
}

export interface BuiltCredentialOfferBase {
  /** Resolved signer option (DID or x5c) */
  signerOption?: ResolvedSignerOption;
  /** Normalized credential entries */
  credentials: BuiltCredential[];
  /** Optional public issuer id to include */
  publicIssuerId?: string;
}

/** Final payload = base + EXACTLY ONE of the two flows */
export type CredentialOfferPayload = BuiltCredentialOfferBase &
  (
    | {
        preAuthorizedCodeFlowConfig: {
          txCode: { description?: string; length: number; input_mode: 'numeric' | 'text' | 'alphanumeric' };
          authorizationServerUrl: string;
        };
        authorizationCodeFlowConfig?: never;
      }
    | {
        authorizationCodeFlowConfig: {
          authorizationServerUrl: string;
        };
        preAuthorizedCodeFlowConfig?: never;
      }
  );

/* ============================================================================
   Small Utilities
============================================================================ */

const isNil = (v: unknown): v is null | undefined => null == v;
const isEmptyString = (v: unknown): boolean => 'string' === typeof v && '' === v.trim();
const isRecord = (v: unknown): v is Record<string, unknown> => Boolean(v) && 'object' === typeof v && !Array.isArray(v);

/** Map DB format string -> API enum */
function mapDbFormatToApiFormat(db: string): CredentialFormat {
  const norm = db.toLowerCase().replace(/_/g, '-');
  if ('sd-jwt' === norm || 'vc+sd-jwt' === norm || 'sdjwt' === norm || 'sd+jwt-vc' === norm) {
    return CredentialFormat.SdJwtVc;
  }
  if ('mdoc' === norm || 'mso-mdoc' === norm || 'mso-mdoc' === norm) {
    return CredentialFormat.Mdoc;
  }
  throw new Error(`Unsupported template format: ${db}`);
}

/** Map API enum -> id suffix required for credentialSupportedId */
function formatSuffix(api: CredentialFormat): 'sdjwt' | 'mdoc' {
  return api === CredentialFormat.SdJwtVc ? 'sdjwt' : 'mdoc';
}

/* ============================================================================
   Validation of Payload vs Template Attributes
============================================================================ */

/** Throw if any template-mandatory claim is missing/empty in payload. */
function assertMandatoryClaims(
  payload: Record<string, unknown>,
  attributes: TemplateAttributes,
  ctx: { templateId: string }
): void {
  const missing: string[] = [];
  for (const [claim, def] of Object.entries(attributes)) {
    if (!def?.mandatory) {
      continue;
    }
    const val = payload[claim];
    if (isNil(val) || isEmptyString(val)) {
      missing.push(claim);
    }
  }
  if (missing.length) {
    throw new Error(`Missing mandatory claims for template "${ctx.templateId}": ${missing.join(', ')}`);
  }
}

/* ============================================================================
   JsonValue → TemplateAttributes Narrowing (Type Guards)
============================================================================ */

function isDisplayArray(v: unknown): v is { name: string; locale: string }[] {
  return Array.isArray(v) && v.every((d) => isRecord(d) && 'string' === typeof d.name && 'string' === typeof d.locale);
}

function isTemplateAttribute(v: unknown): v is TemplateAttribute {
  return (
    isRecord(v) && isDisplayArray(v.display) && 'boolean' === typeof v.mandatory && 'string' === typeof v.value_type
  );
}

/** Accept `unknown` so predicate type (TemplateAttributes) is assignable to parameter type. */
function isTemplateAttributes(v: unknown): v is TemplateAttributes {
  if (!isRecord(v)) {
    return false;
  }
  return Object.values(v).every(isTemplateAttribute);
}

/** Runtime assert + narrow Prisma.JsonValue → TemplateAttributes */
function ensureTemplateAttributes(v: Prisma.JsonValue): TemplateAttributes {
  if (!isTemplateAttributes(v)) {
    throw new Error('Invalid template.attributes shape. Expecting TemplateAttributes map.');
  }
  return v;
}

/* ============================================================================
   Builders
============================================================================ */

/** Build one credential block normalized to API format (using the template's format). */
function buildOneCredential(
  cred: CredentialRequestDtoLike,
  template: credential_templates,
  attrs: TemplateAttributes,
  signerOptions?: SignerOption[]
): BuiltCredential {
  // 1) Validate payload against template attributes
  assertMandatoryClaims(cred.payload, attrs, { templateId: cred.templateId });

  // 2) Decide API format from DB format
  const apiFormat = mapDbFormatToApiFormat(template.format);

  // 3) Build supportedId from template.name + suffix ("-sdjwt" | "-mdoc")
  const suffix = formatSuffix(apiFormat);
  const credentialSupportedId = `${template.name}-${suffix}`;

  // 4) Strip vct ALWAYS (per requirement)
  const payload = { ...(cred.payload as Record<string, unknown>) };
  delete (payload as Record<string, unknown>).vct;

  return {
    credentialSupportedId, // e.g., "BirthCertificateCredential-sdjwt"
    signerOptions: signerOptions[0],
    format: apiFormat, // 'vc+sd-jwt' | 'mdoc'
    payload, // without vct
    ...(cred.disclosureFrame ? { disclosureFrame: cred.disclosureFrame } : {})
  };
}

/**
 * Build the full OID4VC credential offer payload.
 * - Verifies template IDs
 * - Validates mandatory claims per template
 * - Normalizes formats & IDs
 * - Enforces XOR of flow configs
 * - Removes issuerId from the final envelope
 * - Removes vct from all payloads
 * - Sets credentialSupportedId = "<template.name>-sdjwt|mdoc"
 */
export function buildCredentialOfferPayload(
  dto: CreateOidcCredentialOfferDtoLike,
  templates: credential_templates[],
  signerOptions?: SignerOption[]
): CredentialOfferPayload {
  // Index templates
  const byId = new Map(templates.map((t) => [t.id, t]));

  // Verify all requested templateIds exist
  const unknown = dto.credentials.map((c) => c.templateId).filter((id) => !byId.has(id));
  if (unknown.length) {
    throw new Error(`Unknown template ids: ${unknown.join(', ')}`);
  }

  // Build credentials
  const credentials: BuiltCredential[] = dto.credentials.map((cred) => {
    const template = byId.get(cred.templateId)!;
    const attrs = ensureTemplateAttributes(template.attributes); // narrow JsonValue safely
    return buildOneCredential(cred, template, attrs, signerOptions);
  });

  // --- Base envelope (issuerId deliberately NOT included) ---
  const base: BuiltCredentialOfferBase = {
    credentials,
    ...(dto.publicIssuerId ? { publicIssuerId: dto.publicIssuerId } : {})
  };

  // XOR flow selection (defensive)
  const hasPre = Boolean(dto.preAuthorizedCodeFlowConfig);
  const hasAuth = Boolean(dto.authorizationCodeFlowConfig);
  if (hasPre === hasAuth) {
    throw new Error('Provide exactly one of preAuthorizedCodeFlowConfig or authorizationCodeFlowConfig.');
  }

  if (hasPre) {
    return {
      ...base,
      preAuthorizedCodeFlowConfig: dto.preAuthorizedCodeFlowConfig! // definite since hasPre
    };
  }

  return {
    ...base,
    authorizationCodeFlowConfig: dto.authorizationCodeFlowConfig! // definite since !hasPre
  };
}

// -----------------------------------------------------------------------------
// Builder: Update Credential Offer
// -----------------------------------------------------------------------------
export function buildUpdateCredentialOfferPayload(
  dto: CreateOidcCredentialOfferDtoLike,
  templates: credential_templates[]
): { credentials: BuiltCredential[] } {
  // Index templates by id
  const byId = new Map(templates.map((t) => [t.id, t]));

  // Validate all templateIds exist
  const unknown = dto.credentials.map((c) => c.templateId).filter((id) => !byId.has(id));
  if (unknown.length) {
    throw new Error(`Unknown template ids: ${unknown.join(', ')}`);
  }

  // Validate each credential against its template
  const credentials: BuiltCredential[] = dto.credentials.map((cred) => {
    const template = byId.get(cred.templateId)!;
    const attrs = ensureTemplateAttributes(template.attributes); // safely narrow JsonValue

    // check that all payload keys exist in template attributes
    const payloadKeys = Object.keys(cred.payload);
    const invalidKeys = payloadKeys.filter((k) => !attrs[k]);
    if (invalidKeys.length) {
      throw new Error(`Invalid attributes for template "${cred.templateId}": ${invalidKeys.join(', ')}`);
    }

    // also validate mandatory fields are present
    assertMandatoryClaims(cred.payload, attrs, { templateId: cred.templateId });

    // build minimal normalized credential (no vct, issuerId, etc.)
    const apiFormat = mapDbFormatToApiFormat(template.format);
    const suffix = formatSuffix(apiFormat);
    const credentialSupportedId = `${template.name}-${suffix}`;
    return {
      credentialSupportedId,
      format: apiFormat,
      payload: cred.payload,
      ...(cred.disclosureFrame ? { disclosureFrame: cred.disclosureFrame } : {})
    };
  });

  // Only return credentials array here (update flow doesn't need preAuth/auth configs)
  return {
    credentials
  };
}

export function buildCredentialOfferUrl(baseUrl: string, getAllCredentialOffer: GetAllCredentialOffer): string {
  const criteriaParams: string[] = [];

  if (getAllCredentialOffer.publicIssuerId) {
    criteriaParams.push(`publicIssuerId=${encodeURIComponent(getAllCredentialOffer.publicIssuerId)}`);
  }

  if (getAllCredentialOffer.preAuthorizedCode) {
    criteriaParams.push(`preAuthorizedCode=${encodeURIComponent(getAllCredentialOffer.preAuthorizedCode)}`);
  }

  if (getAllCredentialOffer.state) {
    criteriaParams.push(`state=${encodeURIComponent(getAllCredentialOffer.state)}`);
  }

  if (getAllCredentialOffer.credentialOfferUri) {
    criteriaParams.push(`credentialOfferUri=${encodeURIComponent(getAllCredentialOffer.credentialOfferUri)}`);
  }

  if (getAllCredentialOffer.authorizationCode) {
    criteriaParams.push(`authorizationCode=${encodeURIComponent(getAllCredentialOffer.authorizationCode)}`);
  }

  // Append query string if any params exist
  return 0 < criteriaParams.length ? `${baseUrl}?${criteriaParams.join('&')}` : baseUrl;
}
