/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/naming-convention, @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types, camelcase */
import { credential_templates, SignerOption } from '@prisma/client';
import { GetAllCredentialOffer, ISignerOption } from '../../interfaces/oid4vc-issuer-sessions.interfaces';
import { CredentialFormat } from '@credebl/enum/enum';
import {
  CredentialAttribute,
  MdocTemplate,
  SdJwtTemplate
} from 'apps/oid4vc-issuance/interfaces/oid4vc-template.interfaces';
import { BadRequestException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { ResponseMessages } from '@credebl/common/response-messages';
import { X509CertificateRecord } from '@credebl/common/interfaces/x509.interface';
import { dateToSeconds } from '@credebl/common/date-only';

/* ============================================================================
   Domain Types
============================================================================ */

// type ValueType = 'string' | 'date' | 'number' | 'boolean' | 'integer' | string;

// interface TemplateAttribute {
//   display?: { name: string; locale: string }[];
//   mandatory?: boolean;
//   value_type?: ValueType;
// }
// type TemplateAttributes = Record<string, TemplateAttribute>;

export enum SignerMethodOption {
  DID = 'did',
  X5C = 'x5c'
}

export interface DisclosureFrame {
  _sd?: string[];
  [claim: string]: DisclosureFrame | string[] | undefined;
}

export interface validityInfo {
  validFrom: Date;
  validUntil: Date;
}

export interface CredentialRequestDtoLike {
  templateId: string;
  payload: Record<string, unknown>;
  validityInfo?: validityInfo;
  // disclosureFrame?: DisclosureFrame;
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

export interface CredentialTemplateRecord {
  id: string;
  name: string;
  format: string;
  signerOption: SignerOption;
  attributes: any; // Stored as JSON in DB; parsed at runtime as SdJwtTemplate | MdocTemplate
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
          txCode: { description?: string; length: number; input_mode: 'numeric' | 'text' | 'alphanumeric' } | undefined;
          authorizationServerUrl?: string;
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

// const isNil = (value: unknown): value is null | undefined => null == value;
// const isEmptyString = (value: unknown): boolean => 'string' === typeof value && '' === value.trim();
// const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
//   Boolean(value) && 'object' === typeof value && !Array.isArray(value);

/** Map DB format string -> API enum */
function mapDbFormatToApiFormat(dbFormat: string): CredentialFormat {
  const normalized = (dbFormat ?? '').toLowerCase();
  if (['sd-jwt', 'vc+sd-jwt', 'sdjwt', 'sd+jwt-vc'].includes(normalized)) {
    return CredentialFormat.SdJwtVc;
  }
  if ('mso_mdoc' === normalized || 'mso-mdoc' === normalized || 'mdoc' === normalized) {
    return CredentialFormat.Mdoc;
  }
  throw new UnprocessableEntityException(`Unsupported template format: ${dbFormat}`);
}

function formatSuffix(apiFormat: CredentialFormat): 'sdjwt' | 'mdoc' {
  return apiFormat === CredentialFormat.SdJwtVc ? 'sdjwt' : 'mdoc';
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

function buildDisclosureFrameFromTemplate(attributes: CredentialAttribute[]): DisclosureFrame {
  const frame: DisclosureFrame = {};
  const sd: string[] = [];

  for (const attr of attributes) {
    const childFrame =
      attr.children && 0 < attr.children.length ? buildDisclosureFrameFromTemplate(attr.children) : undefined;

    const hasChildDisclosure =
      childFrame && (childFrame._sd?.length || Object.keys(childFrame).some((k) => '_sd' !== k));

    // Case 1: this attribute itself is disclosed
    if (attr.disclose) {
      // If it has children, children are handled separately
      if (!attr.children || 0 === attr.children.length) {
        sd.push(attr.key);
        continue;
      }
    }

    // Case 2: attribute has disclosed children
    if (hasChildDisclosure) {
      frame[attr.key] = childFrame!;
    }
  }

  if (0 < sd.length) {
    frame._sd = sd;
  }

  return frame;
}

function validateCredentialDatesInCertificateWindow(credentialValidityInfo: validityInfo, certificate) {
  // Extract dates from credential
  const credentialValidFrom = new Date(credentialValidityInfo.validFrom);
  const credentialValidTo = new Date(credentialValidityInfo.validUntil);

  // Extract dates from certificate
  const certNotBefore = new Date(certificate.validFrom);
  const certNotAfter = new Date(certificate.expiry);

  // Validate that credential dates are within certificate validity period
  const isCredentialStartValid = credentialValidFrom >= certNotBefore;
  const isCredentialEndValid = credentialValidTo <= certNotAfter;
  const isCredentialDurationValid = credentialValidFrom <= credentialValidTo;

  return {
    isValid: isCredentialStartValid && isCredentialEndValid && isCredentialDurationValid,
    details: {
      credentialStartValid: isCredentialStartValid,
      credentialEndValid: isCredentialEndValid,
      credentialDurationValid: isCredentialDurationValid,
      credentialValidFrom: credentialValidFrom.toISOString(),
      credentialValidTo: credentialValidTo.toISOString(),
      certificateNotBefore: certNotBefore.toISOString(),
      certificateNotAfter: certNotAfter.toISOString()
    }
  };
}

function buildSdJwtCredential(
  credentialRequest: CredentialRequestDtoLike,
  templateRecord: CredentialTemplateRecord,
  signerOptions: ISignerOption[],
  activeCertificateDetails?: X509CertificateRecord[]
): BuiltCredential {
  // For SD-JWT format we expect payload to be a flat map of claims (no namespaces)
  let payloadCopy = { ...(credentialRequest.payload as Record<string, unknown>) };

  // // strip vct if present per requirement
  // delete payloadCopy.vct;

  // Map Prisma SignerOption to builder SignerMethodOption
  // Prisma: DID, X509_P256, X509_ED25519
  // Builder: did, x5c
  let expectedSignerMethod: SignerMethodOption;
  if (templateRecord.signerOption === SignerOption.DID) {
    expectedSignerMethod = SignerMethodOption.DID;
  } else if (
    templateRecord.signerOption === SignerOption.X509_P256 ||
    templateRecord.signerOption === SignerOption.X509_ED25519
  ) {
    expectedSignerMethod = SignerMethodOption.X5C;
  } else {
    throw new UnprocessableEntityException(
      `Unknown signer option "${templateRecord.signerOption}" for template ${templateRecord.id}`
    );
  }

  // Find matching signer option from the available signers
  const templateSignerOption: ISignerOption | undefined = signerOptions?.find((x) => x.method === expectedSignerMethod);
  if (!templateSignerOption) {
    throw new UnprocessableEntityException(
      `Signer option "${expectedSignerMethod}" is not configured for template ${templateRecord.id}`
    );
  }

  if (expectedSignerMethod === SignerMethodOption.X5C && credentialRequest.validityInfo) {
    if (!activeCertificateDetails?.length) {
      throw new UnprocessableEntityException('Active x.509 certificate details are required for x5c signer templates.');
    }
    const certificateDetail = activeCertificateDetails.find(
      (x) => x.certificateBase64 === templateSignerOption.x5c?.[0]
    );
    if (!certificateDetail) {
      throw new UnprocessableEntityException('No active x.509 certificate matches the configured signer option.');
    }

    const validationResult = validateCredentialDatesInCertificateWindow(
      credentialRequest.validityInfo,
      certificateDetail
    );
    if (!validationResult.isValid) {
      throw new UnprocessableEntityException(`${JSON.stringify(validationResult.details)}`);
    }
  }

  if (credentialRequest.validityInfo) {
    const credentialValidFrom = new Date(credentialRequest.validityInfo.validFrom);
    const credentialValidTo = new Date(credentialRequest.validityInfo.validUntil);
    const isCredentialDurationValid = credentialValidFrom <= credentialValidTo;
    if (!isCredentialDurationValid) {
      const errorDetails = {
        credentialDurationValid: isCredentialDurationValid,
        credentialValidFrom: credentialValidFrom.toISOString(),
        credentialValidTo: credentialValidTo.toISOString()
      };
      throw new UnprocessableEntityException(`${JSON.stringify(errorDetails)}`);
    }
    payloadCopy = {
      ...payloadCopy,
      nbf: dateToSeconds(credentialValidFrom),
      exp: dateToSeconds(credentialValidTo)
    };
  }

  const sdJwtTemplate = templateRecord.attributes as SdJwtTemplate;
  payloadCopy.vct = sdJwtTemplate.vct;

  const apiFormat = mapDbFormatToApiFormat(templateRecord.format);
  const idSuffix = formatSuffix(apiFormat);
  const credentialSupportedId = `${templateRecord.name}-${idSuffix}`;
  const disclosureFrame = buildDisclosureFrameFromTemplate(sdJwtTemplate.attributes);

  return {
    credentialSupportedId,
    signerOptions: templateSignerOption ? templateSignerOption : undefined,
    format: apiFormat,
    payload: payloadCopy,
    ...(disclosureFrame ? { disclosureFrame } : {})
  };
}

/** Build an MSO mdoc credential object
 *  - For mdocs we expect the payload to include a `namespaces` map (draft-15 style)
 */
function buildMdocCredential(
  credentialRequest: CredentialRequestDtoLike,
  templateRecord: CredentialTemplateRecord,
  signerOptions: ISignerOption[],
  activeCertificateDetails: X509CertificateRecord[]
): BuiltCredential {
  let incomingPayload = { ...(credentialRequest.payload as Record<string, unknown>) };

  if (
    !credentialRequest.validityInfo ||
    !credentialRequest.validityInfo.validFrom ||
    !credentialRequest.validityInfo.validUntil
  ) {
    throw new UnprocessableEntityException(`${ResponseMessages.oidcIssuerSession.error.missingValidityInfo}`);
  }

  if (!signerOptions?.length || !signerOptions[0].x5c?.length) {
    throw new UnprocessableEntityException('An x5c signer configuration is required for mdoc credentials.');
  }
  if (!activeCertificateDetails?.length) {
    throw new UnprocessableEntityException('Active x.509 certificate details are required for mdoc credentials.');
  }
  const certificateDetail = activeCertificateDetails.find((x) => x.certificateBase64 === signerOptions[0].x5c[0]);
  if (!certificateDetail) {
    throw new UnprocessableEntityException('No active x.509 certificate matches the configured signer option.');
  }
  const validationResult = validateCredentialDatesInCertificateWindow(
    credentialRequest.validityInfo,
    certificateDetail
  );

  if (!validationResult.isValid) {
    throw new UnprocessableEntityException(`${JSON.stringify(validationResult.details)}`);
  }
  incomingPayload = {
    ...incomingPayload,
    validityInfo: credentialRequest.validityInfo
  };

  const apiFormat = mapDbFormatToApiFormat(templateRecord.format);
  const idSuffix = formatSuffix(apiFormat);
  const credentialSupportedId = `${templateRecord.name}-${idSuffix}`;

  return {
    credentialSupportedId,
    signerOptions: signerOptions ? signerOptions[0] : undefined,
    format: apiFormat,
    payload: incomingPayload
  };
}

export function buildCredentialOfferPayload(
  dto: CreateOidcCredentialOfferDtoLike,
  templates: credential_templates[],
  issuerDetails?: {
    publicId: string;
    authorizationServerUrl?: string;
  },
  signerOptions?: ISignerOption[],
  activeCertificateDetails?: X509CertificateRecord[]
): CredentialOfferPayload {
  // Index templates by id
  const templatesById = new Map(templates.map((template) => [template.id, template]));

  // Validate template ids
  const missingTemplateIds = dto.credentials.map((c) => c.templateId).filter((id) => !templatesById.has(id));
  if (missingTemplateIds.length) {
    throw new NotFoundException(`Unknown template ids: ${missingTemplateIds.join(', ')}`);
  }

  // Build each credential using the template's format
  const builtCredentials: BuiltCredential[] = dto.credentials.map((credentialRequest) => {
    const templateRecord: credential_templates = templatesById.get(credentialRequest.templateId)!;

    const validationError = validatePayloadAgainstTemplate(templateRecord, credentialRequest.payload);
    if (!validationError.valid) {
      throw new UnprocessableEntityException(`${validationError.errors.join(', ')}`);
    }

    const templateFormat = (templateRecord as any).format ?? 'vc+sd-jwt';
    const apiFormat = mapDbFormatToApiFormat(templateFormat);
    if (apiFormat === CredentialFormat.SdJwtVc) {
      return buildSdJwtCredential(credentialRequest, templateRecord, signerOptions, activeCertificateDetails);
    }
    if (apiFormat === CredentialFormat.Mdoc) {
      return buildMdocCredential(credentialRequest, templateRecord, signerOptions, activeCertificateDetails);
    }
    throw new UnprocessableEntityException(`Unsupported template format for ${templateFormat}`);
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
      throw new BadRequestException('issuerDetails.authorizationServerUrl must be a non-empty string when provided');
    }
    return {
      ...baseEnvelope,
      preAuthorizedCodeFlowConfig: {
        txCode: DEFAULT_TXCODE, // Pass undefined to enable no auth implementation, TODO: Need to make it configuarble.
        authorizationServerUrl: overrideAuthorizationServerUrl
      }
    };
  }

  // No override provided — use what DTO carries (must be XOR)
  const hasPreAuthFromDto = Boolean(dto.preAuthorizedCodeFlowConfig);
  const hasAuthCodeFromDto = Boolean(dto.authorizationCodeFlowConfig);
  if (hasPreAuthFromDto === hasAuthCodeFromDto) {
    throw new BadRequestException('Provide exactly one of preAuthorizedCodeFlowConfig or authorizationCodeFlowConfig.');
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
