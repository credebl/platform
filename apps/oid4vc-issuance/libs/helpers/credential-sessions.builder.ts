/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/naming-convention, @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types, camelcase */
import { Prisma, credential_templates } from '@prisma/client';
import { GetAllCredentialOffer, SignerOption } from '../../interfaces/oid4vc-issuer-sessions.interfaces';
import { CredentialFormat } from '@credebl/enum/enum';
import {
  CredentialAttribute,
  MdocTemplate,
  SdJwtTemplate
} from 'apps/oid4vc-issuance/interfaces/oid4vc-template.interfaces';
import { UnprocessableEntityException } from '@nestjs/common';

/* ============================================================================
   Domain Types
============================================================================ */

type ValueType = 'string' | 'date' | 'number' | 'boolean' | 'integer' | string;

interface TemplateAttribute {
  display?: { name: string; locale: string }[];
  mandatory?: boolean;
  value_type?: ValueType;
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
  preAuthorizedCodeFlowConfig?: {
    txCode: { description?: string; length: number; input_mode: 'numeric' | 'text' | 'alphanumeric' };
    authorizationServerUrl: string;
  };
  authorizationCodeFlowConfig?: {
    authorizationServerUrl: string;
  };
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
  credentialSupportedId: string;
  signerOptions?: ResolvedSignerOption;
  format: CredentialFormat;
  payload: Record<string, unknown>;
  disclosureFrame?: DisclosureFrame;
}

export interface BuiltCredentialOfferBase {
  signerOption?: ResolvedSignerOption;
  credentials: BuiltCredential[];
  publicIssuerId?: string;
}

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
   Constants
============================================================================ */

/**
 * Default txCode constant requested (used for pre-authorized flow).
 * The user requested this as a constant to be used by the builder.
 */
export const DEFAULT_TXCODE = {
  description: 'test abc',
  length: 4,
  input_mode: 'numeric' as const
};

/* ============================================================================
   Small Utilities
============================================================================ */

const isNil = (value: unknown): value is null | undefined => null == value;
const isEmptyString = (value: unknown): boolean => 'string' === typeof value && '' === value.trim();
const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && 'object' === typeof value && !Array.isArray(value);

/** Map DB format string -> API enum */
function mapDbFormatToApiFormat(dbFormat: string): CredentialFormat {
  const normalized = (dbFormat ?? '').toLowerCase();
  if (['sd-jwt', 'vc+sd-jwt', 'sdjwt', 'sd+jwt-vc'].includes(normalized)) {
    return CredentialFormat.SdJwtVc;
  }
  if ('mso_mdoc' === normalized || 'mso-mdoc' === normalized || 'mdoc' === normalized) {
    return CredentialFormat.Mdoc;
  }
  throw new Error(`Unsupported template format: ${dbFormat}`);
}

function formatSuffix(apiFormat: CredentialFormat): 'sdjwt' | 'mdoc' {
  return apiFormat === CredentialFormat.SdJwtVc ? 'sdjwt' : 'mdoc';
}

/* ============================================================================
   Template Attributes Normalization
   - draft-13 used map: { given_name: { mandatory:true, value_type: "string" } }
   - draft-15 returns attributes as array of attribute objects (with path)
   This helper accepts both and normalizes to TemplateAttributes map.
============================================================================ */

/**
 * Normalize attributes from DB/template into TemplateAttributes map.
 * Accepts:
 * - map: Record<string, TemplateAttribute>
 * - array: Array<{ path: string[], mandatory?: boolean, value_type?: string, display?: ... }>
 */
function normalizeTemplateAttributes(rawAttributes: Prisma.JsonValue): TemplateAttributes {
  // if already a plain record keyed by claim name, cast and return
  if (isPlainRecord(rawAttributes) && !Array.isArray(rawAttributes)) {
    // We still guard that values look like TemplateAttribute, but be permissive.
    return rawAttributes as TemplateAttributes;
  }

  // If attributes are an array (draft-15 style), convert to map
  if (Array.isArray(rawAttributes)) {
    const attributesArray = rawAttributes as unknown as any[];
    const normalizedMap: TemplateAttributes = {};
    for (const attributeEntry of attributesArray) {
      if (!isPlainRecord(attributeEntry)) {
        continue; // skip invalid entries
      }

      // draft-15: path is array like ["org.iso.23220.photoID.1","given_name"] or ["name"]
      const pathValue = attributeEntry.path;
      if (!Array.isArray(pathValue) || 0 === pathValue.length) {
        continue;
      }

      // prefer last path element as local claim name (keeps namespace support)
      const claimName = String(pathValue[pathValue.length - 1]);

      normalizedMap[claimName] = {
        mandatory: Boolean(attributeEntry.mandatory),
        value_type: attributeEntry.value_type ? String(attributeEntry.value_type) : undefined,
        display: Array.isArray(attributeEntry.display)
          ? attributeEntry.display.map((d: any) => ({ name: d.name, locale: d.locale }))
          : undefined
      };
    }
    return normalizedMap;
  }

  // if it's a JSON string, try parse
  if ('string' === typeof rawAttributes) {
    try {
      const parsed = JSON.parse(rawAttributes);
      return normalizeTemplateAttributes(parsed as Prisma.JsonValue);
    } catch {
      throw new Error('Invalid template.attributes JSON string');
    }
  }

  throw new Error('Unrecognized template.attributes shape');
}

/* ============================================================================
   Validation: Mandatory claims
============================================================================ */

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
   Per-format credential builders (separated for readability)
   - buildSdJwtCredential
   - buildMdocCredential
============================================================================ */

/** Build an SD-JWT credential object */
function buildSdJwtCredential(
  credentialRequest: CredentialRequestDtoLike,
  templateRecord: credential_templates,
  signerOptions?: SignerOption[]
): BuiltCredential {
  // For SD-JWT format we expect payload to be a flat map of claims (no namespaces)
  const payloadCopy = { ...(credentialRequest.payload as Record<string, unknown>) };
  // Validate mandatory claims using normalized attributes from templateRecord
  const normalizedAttributes = normalizeTemplateAttributes(templateRecord.attributes);
  assertMandatoryClaims(payloadCopy, normalizedAttributes, { templateId: credentialRequest.templateId });

  // strip vct if present per requirement
  delete payloadCopy.vct;

  const apiFormat = mapDbFormatToApiFormat(templateRecord.format);
  const idSuffix = formatSuffix(apiFormat);
  const credentialSupportedId = `${templateRecord.name}-${idSuffix}`;

  return {
    credentialSupportedId,
    signerOptions: signerOptions ? signerOptions[0] : undefined,
    format: apiFormat,
    payload: payloadCopy,
    ...(credentialRequest.disclosureFrame ? { disclosureFrame: credentialRequest.disclosureFrame } : {})
  };
}

/** Build an MSO mdoc credential object
 *  - For mdocs we expect the payload to include a `namespaces` map (draft-15 style)
 */
function buildMdocCredential(
  credentialRequest: CredentialRequestDtoLike,
  templateRecord: credential_templates,
  signerOptions?: SignerOption[]
): BuiltCredential {
  const incomingPayload = { ...(credentialRequest.payload as Record<string, unknown>) };

  // Normalize attributes and ensure we know the expected claim names
  const normalizedAttributes = normalizeTemplateAttributes(templateRecord.attributes);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const templateDoctype: string | undefined = (templateRecord as any).doctype ?? undefined;
  const defaultNamespace = templateDoctype ?? templateRecord.name;

  // If caller provided already-namespaced payload, keep it; otherwise build a namespaces map
  const workingPayload = { ...incomingPayload };
  if (!workingPayload.namespaces) {
    const namespacesMap: Record<string, Record<string, unknown>> = {};
    // collect claims that match attribute names into the chosen namespace
    for (const claimName of Object.keys(normalizedAttributes)) {
      if (Object.prototype.hasOwnProperty.call(incomingPayload, claimName)) {
        namespacesMap[defaultNamespace] = namespacesMap[defaultNamespace] ?? {};
        namespacesMap[defaultNamespace][claimName] = (incomingPayload as any)[claimName];
        // remove original flattened claim to avoid duplication
        delete (workingPayload as any)[claimName];
      }
    }
    if (0 < Object.keys(namespacesMap).length) {
      (workingPayload as any).namespaces = namespacesMap;
    }
  } else {
    // ensure namespaces is a plain object
    if (!isPlainRecord((workingPayload as any).namespaces)) {
      throw new Error(`Invalid mdoc payload: 'namespaces' must be an object`);
    }
  }

  // Validate mandatory claims exist somewhere inside namespaces
  const missingMandatoryClaims: string[] = [];
  for (const [claimName, attributeDef] of Object.entries(normalizedAttributes)) {
    if (!attributeDef?.mandatory) {
      continue;
    }

    let found = false;
    const namespacesObj = (workingPayload as any).namespaces as Record<string, any>;
    if (namespacesObj && isPlainRecord(namespacesObj)) {
      for (const nsKey of Object.keys(namespacesObj)) {
        const nsContent = namespacesObj[nsKey];
        if (nsContent && Object.prototype.hasOwnProperty.call(nsContent, claimName)) {
          const value = nsContent[claimName];
          if (!isNil(value) && !('string' === typeof value && '' === value.trim())) {
            found = true;
            break;
          }
        }
      }
    }
    if (!found) {
      missingMandatoryClaims.push(claimName);
    }
  }
  if (missingMandatoryClaims.length) {
    throw new Error(
      `Missing mandatory namespaced claims for template "${credentialRequest.templateId}": ${missingMandatoryClaims.join(
        ', '
      )}`
    );
  }

  // strip vct if present
  delete (workingPayload as Record<string, unknown>).vct;

  const apiFormat = mapDbFormatToApiFormat(templateRecord.format);
  const idSuffix = formatSuffix(apiFormat);
  const credentialSupportedId = `${templateRecord.name}-${idSuffix}`;

  return {
    credentialSupportedId,
    signerOptions: signerOptions ? signerOptions[0] : undefined,
    format: apiFormat,
    payload: workingPayload,
    ...(credentialRequest.disclosureFrame ? { disclosureFrame: credentialRequest.disclosureFrame } : {})
  };
}

/* ============================================================================
   Main Builder: buildCredentialOfferPayload
   - Now delegates per-format build to the two helpers above
   - Accepts `authorizationServerUrl` parameter; txCode is a constant above
============================================================================ */

export function buildCredentialOfferPayload(
  dto: CreateOidcCredentialOfferDtoLike,
  templates: credential_templates[],
  issuerDetails?: {
    publicId: string;
    authorizationServerUrl?: string;
  },
  signerOptions?: SignerOption[]
): CredentialOfferPayload {
  // Index templates by id
  const templatesById = new Map(templates.map((template) => [template.id, template]));

  // Validate template ids
  const missingTemplateIds = dto.credentials.map((c) => c.templateId).filter((id) => !templatesById.has(id));
  if (missingTemplateIds.length) {
    throw new Error(`Unknown template ids: ${missingTemplateIds.join(', ')}`);
  }

  // Build each credential using the template's format
  const builtCredentials: BuiltCredential[] = dto.credentials.map((credentialRequest) => {
    const templateRecord = templatesById.get(credentialRequest.templateId)!;
    // we normalize attributes to support both draft-13 (map) and draft-15 (array) shapes
    normalizeTemplateAttributes(templateRecord.attributes);

    const templateFormat = (templateRecord as any).format ?? 'vc+sd-jwt';
    const apiFormat = mapDbFormatToApiFormat(templateFormat);

    if (apiFormat === CredentialFormat.SdJwtVc) {
      return buildSdJwtCredential(credentialRequest, templateRecord, signerOptions);
    }
    if (apiFormat === CredentialFormat.Mdoc) {
      return buildMdocCredential(credentialRequest, templateRecord, signerOptions);
    }
    throw new Error(`Unsupported template format for ${templateFormat}`);
  });

  // Base envelope: allow explicit publicIssuerId from DTO or fallback to issuerDetails.publicId
  const publicIssuerIdFromDto = dto.publicIssuerId;
  const publicIssuerIdFromIssuerDetails = issuerDetails?.publicId;
  const finalPublicIssuerId = publicIssuerIdFromDto ?? publicIssuerIdFromIssuerDetails;

  const baseEnvelope: BuiltCredentialOfferBase = {
    credentials: builtCredentials,
    ...(finalPublicIssuerId ? { publicIssuerId: finalPublicIssuerId } : {})
  };

  // Determine which authorization flow to return:
  // Priority:
  // 1) If issuerDetails.authorizationServerUrl is provided, return preAuthorizedCodeFlowConfig using DEFAULT_TXCODE
  // 2) Else fall back to flows present in DTO (still enforce XOR)
  const overrideAuthorizationServerUrl = issuerDetails?.authorizationServerUrl;
  if (overrideAuthorizationServerUrl) {
    if ('string' !== typeof overrideAuthorizationServerUrl || '' === overrideAuthorizationServerUrl.trim()) {
      throw new Error('issuerDetails.authorizationServerUrl must be a non-empty string when provided');
    }
    return {
      ...baseEnvelope,
      preAuthorizedCodeFlowConfig: {
        txCode: DEFAULT_TXCODE,
        authorizationServerUrl: overrideAuthorizationServerUrl
      }
    };
  }

  // No override provided — use what DTO carries (must be XOR)
  const hasPreAuthFromDto = Boolean(dto.preAuthorizedCodeFlowConfig);
  const hasAuthCodeFromDto = Boolean(dto.authorizationCodeFlowConfig);
  if (hasPreAuthFromDto === hasAuthCodeFromDto) {
    throw new Error('Provide exactly one of preAuthorizedCodeFlowConfig or authorizationCodeFlowConfig.');
  }
  if (hasPreAuthFromDto) {
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

/* ============================================================================
   Update Credential Offer builder (keeps behavior, clearer names)
============================================================================ */

export function buildUpdateCredentialOfferPayload(
  dto: CreateOidcCredentialOfferDtoLike,
  templates: credential_templates[]
): { credentials: BuiltCredential[] } {
  const templatesById = new Map(templates.map((template) => [template.id, template]));

  const missingTemplateIds = dto.credentials.map((c) => c.templateId).filter((id) => !templatesById.has(id));
  if (missingTemplateIds.length) {
    throw new Error(`Unknown template ids: ${missingTemplateIds.join(', ')}`);
  }

  const normalizedCredentials: BuiltCredential[] = dto.credentials.map((credentialRequest) => {
    const templateRecord = templatesById.get(credentialRequest.templateId)!;

    // Normalize attributes shape and ensure it's valid
    const attributesMap = normalizeTemplateAttributes(templateRecord.attributes);

    // ensure payload keys match known attributes
    const payloadKeys = Object.keys(credentialRequest.payload);
    const invalidPayloadKeys = payloadKeys.filter((payloadKey) => !attributesMap[payloadKey]);
    if (invalidPayloadKeys.length) {
      throw new Error(
        `Invalid attributes for template "${credentialRequest.templateId}": ${invalidPayloadKeys.join(', ')}`
      );
    }

    // Validate mandatory claims
    assertMandatoryClaims(credentialRequest.payload, attributesMap, { templateId: credentialRequest.templateId });

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

export function validatePayloadAgainstTemplate(template: any, payload: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const validateAttributes = (attributes: CredentialAttribute[], data: any, path = '') => {
    for (const attr of attributes) {
      const currentPath = path ? `${path}.${attr.key}` : attr.key;
      const value = data?.[attr.key];

      // Check for missing mandatory value
      const isEmpty =
        value === undefined ||
        null === value ||
        ('string' === typeof value && '' === value.trim()) ||
        ('object' === typeof value && !Array.isArray(value) && 0 === Object.keys(value).length);

      if (attr.mandatory && isEmpty) {
        errors.push(`Missing mandatory attribute: ${currentPath}`);
      }

      // Recurse for nested attributes
      if (attr.children && 'object' === typeof value && null !== value) {
        validateAttributes(attr.children, value, currentPath);
      }
    }
  };

  if (CredentialFormat.SdJwtVc === template.format) {
    validateAttributes((template.attributes as SdJwtTemplate).attributes ?? [], payload);
  } else if (CredentialFormat.Mdoc === template.format) {
    const namespaces = payload?.namespaces;
    if (!namespaces) {
      errors.push('Missing namespaces object in mdoc payload.');
    } else {
      const templateNamespaces = (template.attributes as MdocTemplate).namespaces;
      for (const ns of templateNamespaces ?? []) {
        const nsData = namespaces[ns.namespace];
        if (!nsData) {
          errors.push(`Missing namespace: ${ns.namespace}`);
          continue;
        }
        validateAttributes(ns.attributes, nsData, ns.namespace);
      }
    }
  }

  return { valid: 0 === errors.length, errors };
}

function buildDisclosureFrameFromTemplate(template: { attributes: CredentialAttribute[] }) {
  const disclosureFrame: DisclosureFrame = {};

  const buildFrame = (attributes: CredentialAttribute[]) => {
    const frame: Record<string, any> = {};

    for (const attr of attributes) {
      if (attr.children?.length) {
        // Handle nested attributes recursively
        const subFrame = buildFrame(attr.children);
        // Include parent only if disclose is true or it has children with disclosure
        if (attr.disclose || 0 < Object.keys(subFrame).length) {
          frame[attr.key] = subFrame;
        }
      } else if (attr.disclose !== undefined) {
        frame[attr.key] = Boolean(attr.disclose);
      }
    }

    return frame;
  };

  Object.assign(disclosureFrame, buildFrame(template.attributes));

  return disclosureFrame;
}

function buildSdJwtCredentialNew(
  credentialRequest: CredentialRequestDtoLike,
  templateRecord: any,
  signerOptions?: SignerOption[]
): BuiltCredential {
  // For SD-JWT format we expect payload to be a flat map of claims (no namespaces)
  const payloadCopy = { ...(credentialRequest.payload as Record<string, unknown>) };

  // // strip vct if present per requirement
  // delete payloadCopy.vct;

  const sdJwtTemplate = templateRecord.attributes as SdJwtTemplate;
  payloadCopy.vct = sdJwtTemplate.vct;

  const apiFormat = mapDbFormatToApiFormat(templateRecord.format);
  const idSuffix = formatSuffix(apiFormat);
  const credentialSupportedId = `${templateRecord.name}-${idSuffix}`;
  const disclosureFrame = buildDisclosureFrameFromTemplate({ attributes: sdJwtTemplate.attributes });

  return {
    credentialSupportedId,
    signerOptions: signerOptions ? signerOptions[0] : undefined,
    format: apiFormat,
    payload: payloadCopy,
    ...(disclosureFrame ? { disclosureFrame } : {})
  };
}

/** Build an MSO mdoc credential object
 *  - For mdocs we expect the payload to include a `namespaces` map (draft-15 style)
 */
function buildMdocCredentialNew(
  credentialRequest: CredentialRequestDtoLike,
  templateRecord: any,
  signerOptions?: SignerOption[]
): BuiltCredential {
  const incomingPayload = { ...(credentialRequest.payload as Record<string, unknown>) };

  // // If caller provided already-namespaced payload, keep it; otherwise build a namespaces map
  // const workingPayload = { ...incomingPayload };
  // if (!workingPayload.namespaces) {
  //   const namespacesMap: Record<string, Record<string, unknown>> = {};
  //   // collect claims that match attribute names into the chosen namespace
  //   for (const claimName of Object.keys(normalizedAttributes)) {
  //     if (Object.prototype.hasOwnProperty.call(incomingPayload, claimName)) {
  //       namespacesMap[defaultNamespace] = namespacesMap[defaultNamespace] ?? {};
  //       namespacesMap[defaultNamespace][claimName] = (incomingPayload as any)[claimName];
  //       // remove original flattened claim to avoid duplication
  //       delete (workingPayload as any)[claimName];
  //     }
  //   }
  //   if (0 < Object.keys(namespacesMap).length) {
  //     (workingPayload as any).namespaces = namespacesMap;
  //   }
  // } else {
  //   // ensure namespaces is a plain object
  //   if (!isPlainRecord((workingPayload as any).namespaces)) {
  //     throw new Error(`Invalid mdoc payload: 'namespaces' must be an object`);
  //   }
  // }

  const apiFormat = mapDbFormatToApiFormat(templateRecord.format);
  const idSuffix = formatSuffix(apiFormat);
  const credentialSupportedId = `${templateRecord.name}-${idSuffix}`;

  return {
    credentialSupportedId,
    signerOptions: signerOptions ? signerOptions[0] : undefined,
    format: apiFormat,
    payload: incomingPayload,
    ...(credentialRequest.disclosureFrame ? { disclosureFrame: credentialRequest.disclosureFrame } : {})
  };
}

export function buildCredentialOfferPayloadNew(
  dto: CreateOidcCredentialOfferDtoLike,
  templates: credential_templates[],
  issuerDetails?: {
    publicId: string;
    authorizationServerUrl?: string;
  },
  signerOptions?: SignerOption[]
): CredentialOfferPayload {
  // Index templates by id
  const templatesById = new Map(templates.map((template) => [template.id, template]));

  // Validate template ids
  const missingTemplateIds = dto.credentials.map((c) => c.templateId).filter((id) => !templatesById.has(id));
  if (missingTemplateIds.length) {
    throw new Error(`Unknown template ids: ${missingTemplateIds.join(', ')}`);
  }

  // Build each credential using the template's format
  const builtCredentials: BuiltCredential[] = dto.credentials.map((credentialRequest) => {
    const templateRecord = templatesById.get(credentialRequest.templateId)!;

    const validationError = validatePayloadAgainstTemplate(templateRecord, credentialRequest.payload);
    if (!validationError.valid) {
      throw new UnprocessableEntityException(`${validationError.errors.join(', ')}`);
    }

    const templateFormat = (templateRecord as any).format ?? 'vc+sd-jwt';
    const apiFormat = mapDbFormatToApiFormat(templateFormat);

    if (apiFormat === CredentialFormat.SdJwtVc) {
      return buildSdJwtCredentialNew(credentialRequest, templateRecord, signerOptions);
    }
    if (apiFormat === CredentialFormat.Mdoc) {
      return buildMdocCredentialNew(credentialRequest, templateRecord, signerOptions);
    }
    throw new Error(`Unsupported template format for ${templateFormat}`);
  });

  // Base envelope: allow explicit publicIssuerId from DTO or fallback to issuerDetails.publicId
  const publicIssuerIdFromDto = dto.publicIssuerId;
  const publicIssuerIdFromIssuerDetails = issuerDetails?.publicId;
  const finalPublicIssuerId = publicIssuerIdFromDto ?? publicIssuerIdFromIssuerDetails;

  const baseEnvelope: BuiltCredentialOfferBase = {
    credentials: builtCredentials,
    ...(finalPublicIssuerId ? { publicIssuerId: finalPublicIssuerId } : {})
  };

  // Determine which authorization flow to return:
  // Priority:
  // 1) If issuerDetails.authorizationServerUrl is provided, return preAuthorizedCodeFlowConfig using DEFAULT_TXCODE
  // 2) Else fall back to flows present in DTO (still enforce XOR)
  const overrideAuthorizationServerUrl = issuerDetails?.authorizationServerUrl;
  if (overrideAuthorizationServerUrl) {
    if ('string' !== typeof overrideAuthorizationServerUrl || '' === overrideAuthorizationServerUrl.trim()) {
      throw new Error('issuerDetails.authorizationServerUrl must be a non-empty string when provided');
    }
    return {
      ...baseEnvelope,
      preAuthorizedCodeFlowConfig: {
        txCode: DEFAULT_TXCODE,
        authorizationServerUrl: overrideAuthorizationServerUrl
      }
    };
  }

  // No override provided — use what DTO carries (must be XOR)
  const hasPreAuthFromDto = Boolean(dto.preAuthorizedCodeFlowConfig);
  const hasAuthCodeFromDto = Boolean(dto.authorizationCodeFlowConfig);
  if (hasPreAuthFromDto === hasAuthCodeFromDto) {
    throw new Error('Provide exactly one of preAuthorizedCodeFlowConfig or authorizationCodeFlowConfig.');
  }
  if (hasPreAuthFromDto) {
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
