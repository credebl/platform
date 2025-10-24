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
  path: string[];
}
type TemplateAttributes = TemplateAttribute[];

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

const isNil = (value: unknown): value is null | undefined => null == value;
const isEmptyString = (value: unknown): boolean => 'string' === typeof value && '' === value.trim();
// const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
//   Boolean(value) && 'object' === typeof value && !Array.isArray(value);

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
function assertMandatoryClaims(
  payload: Record<string, unknown>,
  attributes: TemplateAttributes,
  context: { templateId: string }
): void {
  const missingClaims: string[] = [];

  for (const attribute of attributes) {
    if (!attribute.mandatory) {
      continue;
    }

    // Navigate through nested path
    let value: unknown = payload;
    for (const key of attribute.path) {
      if (!value || 'object' !== typeof value) {
        value = undefined;
        break;
      }
      value = (value as Record<string, unknown>)[key];
    }

    if (isNil(value) || isEmptyString(value)) {
      missingClaims.push(attribute.path.join('.'));
    }
  }

  if (missingClaims.length) {
    throw new Error(`Missing mandatory claims for template "${context.templateId}": ${missingClaims.join(', ')}`);
  }
}

/* ============================================================================
   JsonValue → TemplateAttributes Narrowing (Type Guards)
============================================================================ */

// function isDisplayArray(value: unknown): value is { name: string; locale: string }[] {
//   return (
//     Array.isArray(value) &&
//     value.every(
//       (entry) =>
//         isPlainRecord(entry) && 'string' === typeof (entry as any).name && 'string' === typeof (entry as any).locale
//     )
//   );
// }

/* ============================================================================
   Improved ensureTemplateAttributes: runtime assert with helpful errors
============================================================================ */

const ALLOWED_VALUE_TYPES: ValueType[] = ['string', 'date', 'number', 'boolean', 'integer'];

function ensureTemplateAttributes(jsonValue: Prisma.JsonValue): TemplateAttributes {
  // Expect top-level array
  if (!Array.isArray(jsonValue)) {
    throw new Error(
      `Invalid template.attributes: expected an array of claim definitions but received ${
        null === jsonValue ? 'null' : typeof jsonValue
      }.\n\nExample:\n[\n  {\n    "path": ["given_name"],\n    "mandatory": true,\n    "value_type": "string",\n    "display": [\n      { "name": "Given Name", "locale": "en-US" }\n    ]\n  }\n]`
    );
  }

  const claims = jsonValue as Record<string, unknown>[];
  const problems: string[] = [];
  const suggestedFixes: string[] = [];

  for (let i = 0; i < claims.length; i++) {
    const claim = claims[i];

    if (!claim || 'object' !== typeof claim || Array.isArray(claim)) {
      problems.push(`claims[${i}]: expected an object but got ${typeof claim}`);
      suggestedFixes.push(`claims[${i}]: remove or replace this invalid entry with a valid claim object.`);
      continue;
    }

    const { path, mandatory, value_type, display } = claim as Record<string, unknown>;

    // Validate path
    if (!Array.isArray(path) || !path.every((p) => 'string' === typeof p)) {
      problems.push(`claims[${i}].path: expected an array of strings, e.g. ["given_name"]`);
      suggestedFixes.push(`claims[${i}].path: ensure it's an array like ["attribute_name"].`);
    } else if (0 === path.length) {
      problems.push(`claims[${i}].path: must not be empty`);
      suggestedFixes.push(`claims[${i}].path: add at least one string key to identify the claim.`);
    }

    // Validate mandatory
    if ('boolean' !== typeof mandatory) {
      problems.push(`claims[${i}].mandatory: expected boolean but got ${typeof mandatory}`);
      suggestedFixes.push(`claims[${i}].mandatory: defaulting to false.`);
      (claims[i] as any).mandatory = false;
    }

    // Validate value_type
    if ('string' !== typeof value_type) {
      problems.push(`claims[${i}].value_type: expected string but got ${typeof value_type}`);
      suggestedFixes.push(`claims[${i}].value_type: defaulting to "string".`);
      (claims[i] as any).value_type = 'string';
    } else if (!ALLOWED_VALUE_TYPES.includes(value_type as ValueType)) {
      problems.push(
        `claims[${i}].value_type: unsupported value_type "${value_type}". Allowed types: ${ALLOWED_VALUE_TYPES.join(', ')}`
      );
      suggestedFixes.push(`claims[${i}].value_type: change to one of ${ALLOWED_VALUE_TYPES.join(', ')}.`);
      (claims[i] as any).value_type = 'string';
    }

    // Validate display (optional)
    if (display !== undefined) {
      if (!Array.isArray(display)) {
        problems.push(`claims[${i}].display: expected array of { name, locale }`);
        suggestedFixes.push(
          `claims[${i}].display: convert to an array of objects like [{ "name": "Label", "locale": "en-US" }].`
        );
      } else {
        for (let j = 0; j < display.length; j++) {
          const d = display[j];
          if (
            !d ||
            'object' !== typeof d ||
            Array.isArray(d) ||
            'string' !== typeof (d as any).name ||
            'string' !== typeof (d as any).locale
          ) {
            problems.push(`claims[${i}].display[${j}]: expected { name: string, locale: string }`);
            suggestedFixes.push(`claims[${i}].display[${j}]: ensure both "name" and "locale" are strings.`);
          }
        }
      }
    }
  }

  if (0 < problems.length) {
    throw new Error(
      `Invalid template.attributes structure:\n- ${problems.join(
        '\n- '
      )}\n\nExample valid structure:\n[\n  {\n    "path": ["given_name"],\n    "mandatory": true,\n    "value_type": "string",\n    "display": [\n      { "name": "Given Name", "locale": "en-US" }\n    ]\n  }\n]`
    );
  }

  // Return safely typed array
  return claims as unknown as TemplateAttributes;
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
