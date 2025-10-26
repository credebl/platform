/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/naming-convention, @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types, camelcase */
import { Prisma, credential_templates } from '@prisma/client';
import { GetAllCredentialOffer, SignerOption } from '../../interfaces/oid4vc-issuer-sessions.interfaces';
import { CredentialFormat } from '@credebl/enum/enum';
/* ============================================================================
   Domain Types
============================================================================ */

type ValueType = 'string' | 'date' | 'number' | 'boolean' | 'integer' | string;

interface TemplateAttribute {
  display: { name: string; locale: string }[];
  mandatory: boolean;
  value_type: ValueType;
}
type TemplateAttributes = Record<string, TemplateAttribute>;

export enum SignerMethodOption {
  DID = 'did',
  X5C = 'x5c'
}

export type DisclosureFrame = Record<string, boolean | Record<string, boolean>>;

export interface CredentialRequestDtoLike {
  templateId: string;
  payload: Record<string, unknown>;
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

const isNil = (value: unknown): value is null | undefined => null == value;
const isEmptyString = (value: unknown): boolean => 'string' === typeof value && '' === value.trim();
const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && 'object' === typeof value && !Array.isArray(value);

/** Map DB format string -> API enum */
function mapDbFormatToApiFormat(dbFormat: string): CredentialFormat {
  if ('sd-jwt' === dbFormat || 'vc+sd-jwt' === dbFormat || 'sdjwt' === dbFormat || 'sd+jwt-vc' === dbFormat) {
    return CredentialFormat.SdJwtVc;
  }
  if ('mso_mdoc' === dbFormat) {
    return CredentialFormat.Mdoc;
  }
  throw new Error(`Unsupported template format: ${dbFormat}`);
}

/** Map API enum -> id suffix required for credentialSupportedId */
function formatSuffix(apiFormat: CredentialFormat): 'sdjwt' | 'mdoc' {
  return apiFormat === CredentialFormat.SdJwtVc ? 'sdjwt' : 'mdoc';
}

/* ============================================================================
   Validation of Payload vs Template Attributes
============================================================================ */

/** Throw if any template-mandatory claim is missing/empty in payload. */
function assertMandatoryClaims(
  payload: Record<string, unknown>,
  attributes: TemplateAttributes,
  context: { templateId: string }
): void {
  const missingClaims: string[] = [];
  for (const [claimName, attributeDefinition] of Object.entries(attributes)) {
    if (!attributeDefinition?.mandatory) {
      continue;
    }
    const claimValue = payload[claimName];
    if (isNil(claimValue) || isEmptyString(claimValue)) {
      missingClaims.push(claimName);
    }
  }
  if (missingClaims.length) {
    throw new Error(`Missing mandatory claims for template "${context.templateId}": ${missingClaims.join(', ')}`);
  }
}

/* ============================================================================
   JsonValue → TemplateAttributes Narrowing (Type Guards)
============================================================================ */

function isDisplayArray(value: unknown): value is { name: string; locale: string }[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        isPlainRecord(entry) && 'string' === typeof (entry as any).name && 'string' === typeof (entry as any).locale
    )
  );
}

/* ============================================================================
   Improved ensureTemplateAttributes: runtime assert with helpful errors
============================================================================ */

const ALLOWED_VALUE_TYPES: ValueType[] = ['string', 'date', 'number', 'boolean', 'integer'];

function ensureTemplateAttributes(jsonValue: Prisma.JsonValue): TemplateAttributes {
  if (!isPlainRecord(jsonValue)) {
    throw new Error(
      `Invalid template.attributes: expected an object map but received ${
        null === jsonValue ? 'null' : typeof jsonValue
      }.\n\nFix: provide an object whose keys are attribute names and whose values are attribute definitions, e.g.\n{\n  "given_name": { "mandatory": true, "value_type": "string" }\n}`
    );
  }

  const attributesMap = jsonValue as Record<string, unknown>;
  const attributeKeys = Object.keys(attributesMap);
  if (0 === attributeKeys.length) {
    throw new Error(
      'Invalid template.attributes: object is empty (no attributes defined).\n\nFix: add at least one attribute definition, for example:\n{\n  "given_name": { "mandatory": true, "value_type": "string" }\n}'
    );
  }

  const problems: string[] = [];
  const suggestedFixes: string[] = [];

  for (const attributeKey of attributeKeys) {
    const rawAttributeDef = attributesMap[attributeKey];

    if (!isPlainRecord(rawAttributeDef)) {
      problems.push(
        `${attributeKey}: expected an object but got ${null === rawAttributeDef ? 'null' : typeof rawAttributeDef}`
      );
      suggestedFixes.push(
        `Replace attribute "${attributeKey}" value with an object, e.g.\n"${attributeKey}": { "mandatory": true, "value_type": "string" }`
      );
      continue;
    }

    // mandatory checks
    if (!('mandatory' in rawAttributeDef)) {
      problems.push(`${attributeKey}.mandatory: missing`);
      suggestedFixes.push(
        `Add mandatory boolean for "${attributeKey}":\n"${attributeKey}": { "mandatory": true, "value_type": "string" }`
      );
    } else if ('boolean' !== typeof (rawAttributeDef as any).mandatory) {
      problems.push(`${attributeKey}.mandatory: expected boolean but got ${typeof (rawAttributeDef as any).mandatory}`);
      suggestedFixes.push(
        `Set "mandatory" to a boolean for "${attributeKey}", e.g.\n"${attributeKey}": { "mandatory": true, "value_type": "string" }`
      );
    }

    // value_type checks
    if (!('value_type' in rawAttributeDef)) {
      problems.push(`${attributeKey}.value_type: missing`);
      suggestedFixes.push(
        `Add value_type for "${attributeKey}", for example:\n"${attributeKey}": { "mandatory": true, "value_type": "string" }`
      );
    } else if ('string' !== typeof (rawAttributeDef as any).value_type) {
      problems.push(
        `${attributeKey}.value_type: expected string but got ${typeof (rawAttributeDef as any).value_type}`
      );
      suggestedFixes.push(
        `Make sure "value_type" is a string for "${attributeKey}", e.g.\n"${attributeKey}": { "mandatory": true, "value_type": "string" }`
      );
    } else {
      const declaredType = (rawAttributeDef as any).value_type as string;
      if (!ALLOWED_VALUE_TYPES.includes(declaredType as ValueType)) {
        problems.push(
          `${attributeKey}.value_type: unsupported value_type "${declaredType}". Allowed types: ${ALLOWED_VALUE_TYPES.join(', ')}`
        );
        suggestedFixes.push(
          `Use one of the allowed types for "${attributeKey}", e.g.\n"${attributeKey}": { "mandatory": true, "value_type": "string" }`
        );
      }
    }

    // display checks (optional)
    if ('display' in rawAttributeDef && !isDisplayArray((rawAttributeDef as any).display)) {
      problems.push(`${attributeKey}.display: expected array of { name: string, locale: string }`);
      suggestedFixes.push(
        `Fix "display" for "${attributeKey}" to be an array of objects with name/locale, e.g.\n"${attributeKey}": { "mandatory": true, "value_type": "string", "display": [{ "name": "Given Name", "locale": "en-US" }] }`
      );
    }
  }

  if (0 < problems.length) {
    // Build a user-friendly message: problems + suggested fixes (unique)
    const uniqueFixes = Array.from(new Set(suggestedFixes)).slice(0, 20);
    const fixesText = uniqueFixes.length
      ? `\n\nSuggested fixes (copy-paste examples):\n- ${uniqueFixes.join('\n- ')}`
      : '';

    // Include a small truncated sample of the attributes to help debugging
    const samplePreview = JSON.stringify(
      Object.fromEntries(attributeKeys.slice(0, 10).map((key) => [key, attributesMap[key]])),
      (_, value) => {
        if ('string' === typeof value && 200 < value.length) {
          return `${value.slice(0, 200)}...`;
        }
        return value;
      },
      2
    );

    throw new Error(
      `Invalid template.attributes shape. Problems found:\n- ${problems.join(
        '\n- '
      )}\n\nExample attributes (truncated):\n${samplePreview}${fixesText}`
    );
  }

  // Safe to cast to TemplateAttributes
  return attributesMap as TemplateAttributes;
}

/* ============================================================================
   Builders
============================================================================ */

/** Build one credential block normalized to API format (using the template's format). */
function buildOneCredential(
  credentialRequest: CredentialRequestDtoLike,
  templateRecord: credential_templates,
  templateAttributes: TemplateAttributes,
  signerOptions?: SignerOption[]
): BuiltCredential {
  // 1) Validate payload against template attributes
  assertMandatoryClaims(credentialRequest.payload, templateAttributes, { templateId: credentialRequest.templateId });

  // 2) Decide API format from DB format
  const selectedApiFormat = mapDbFormatToApiFormat(templateRecord.format);

  // 3) Build supportedId from template.name + suffix ("-sdjwt" | "-mdoc")
  const idSuffix = formatSuffix(selectedApiFormat);
  const credentialSupportedId = `${templateRecord.name}-${idSuffix}`;

  // 4) Strip vct ALWAYS (per requirement)
  const normalizedPayload = { ...(credentialRequest.payload as Record<string, unknown>) };
  delete (normalizedPayload as Record<string, unknown>).vct;

  return {
    credentialSupportedId, // e.g., "BirthCertificateCredential-sdjwt"
    signerOptions: signerOptions ? signerOptions[0] : undefined,
    format: selectedApiFormat, // 'vc+sd-jwt' | 'mdoc'
    payload: normalizedPayload, // without vct
    ...(credentialRequest.disclosureFrame ? { disclosureFrame: credentialRequest.disclosureFrame } : {})
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
  const templatesById = new Map(templates.map((template) => [template.id, template]));

  // Verify all requested templateIds exist
  const unknownTemplateIds = dto.credentials
    .map((c) => c.templateId)
    .filter((requestedId) => !templatesById.has(requestedId));
  if (unknownTemplateIds.length) {
    throw new Error(`Unknown template ids: ${unknownTemplateIds.join(', ')}`);
  }

  // Build credentials
  const builtCredentials: BuiltCredential[] = dto.credentials.map((credentialRequest) => {
    const templateRecord = templatesById.get(credentialRequest.templateId)!;
    const resolvedAttributes = ensureTemplateAttributes(templateRecord.attributes); // narrow JsonValue safely
    return buildOneCredential(credentialRequest, templateRecord, resolvedAttributes, signerOptions);
  });

  // --- Base envelope (issuerId deliberately NOT included) ---
  const baseEnvelope: BuiltCredentialOfferBase = {
    credentials: builtCredentials,
    ...(dto.publicIssuerId ? { publicIssuerId: dto.publicIssuerId } : {})
  };

  // XOR flow selection (defensive)
  const hasPreAuthFlow = Boolean(dto.preAuthorizedCodeFlowConfig);
  const hasAuthCodeFlow = Boolean(dto.authorizationCodeFlowConfig);
  if (hasPreAuthFlow === hasAuthCodeFlow) {
    throw new Error('Provide exactly one of preAuthorizedCodeFlowConfig or authorizationCodeFlowConfig.');
  }

  if (hasPreAuthFlow) {
    return {
      ...baseEnvelope,
      preAuthorizedCodeFlowConfig: dto.preAuthorizedCodeFlowConfig!
    };
  }

  return {
    ...baseEnvelope,
    authorizationCodeFlowConfig: dto.authorizationCodeFlowConfig!
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
  const templatesById = new Map(templates.map((template) => [template.id, template]));

  // Validate all templateIds exist
  const unknownTemplateIds = dto.credentials
    .map((c) => c.templateId)
    .filter((requestedId) => !templatesById.has(requestedId));
  if (unknownTemplateIds.length) {
    throw new Error(`Unknown template ids: ${unknownTemplateIds.join(', ')}`);
  }

  // Validate each credential against its template
  const normalizedCredentials: BuiltCredential[] = dto.credentials.map((credentialRequest) => {
    const templateRecord = templatesById.get(credentialRequest.templateId)!;
    const resolvedAttributes = ensureTemplateAttributes(templateRecord.attributes); // safely narrow JsonValue

    // check that all payload keys exist in template attributes
    const payloadKeys = Object.keys(credentialRequest.payload);
    const invalidPayloadKeys = payloadKeys.filter((payloadKey) => !resolvedAttributes[payloadKey]);
    if (invalidPayloadKeys.length) {
      throw new Error(
        `Invalid attributes for template "${credentialRequest.templateId}": ${invalidPayloadKeys.join(', ')}`
      );
    }

    // also validate mandatory fields are present
    assertMandatoryClaims(credentialRequest.payload, resolvedAttributes, { templateId: credentialRequest.templateId });

    // build minimal normalized credential (no vct, issuerId, etc.)
    const selectedApiFormat = mapDbFormatToApiFormat(templateRecord.format);
    const idSuffix = formatSuffix(selectedApiFormat);
    const credentialSupportedId = `${templateRecord.name}-${idSuffix}`;

    return {
      credentialSupportedId,
      format: selectedApiFormat,
      payload: credentialRequest.payload,
      ...(credentialRequest.disclosureFrame ? { disclosureFrame: credentialRequest.disclosureFrame } : {})
    };
  });

  // Only return credentials array here (update flow doesn't need preAuth/auth configs)
  return {
    credentials: normalizedCredentials
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
