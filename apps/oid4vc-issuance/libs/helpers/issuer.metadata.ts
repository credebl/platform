/* eslint-disable camelcase */
import { oidc_issuer, Prisma } from '@prisma/client';
import { batchCredentialIssuanceDefault } from '../../constant/issuance';
import { CreateOidcCredentialOffer } from '../../interfaces/oid4vc-issuer-sessions.interfaces';
import { IssuerResponse } from 'apps/oid4vc-issuance/interfaces/oid4vc-issuance.interfaces';
import {
  Claim,
  ClaimDisplay,
  CredentialAttribute,
  MdocTemplate,
  SdJwtTemplate
} from 'apps/oid4vc-issuance/interfaces/oid4vc-template.interfaces';
import { CredentialFormat } from '@credebl/enum/enum';

type AttributeDisplay = { name: string; locale: string };

//TODO: Fix this eslint issue
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type AttributeDef = {
  display?: AttributeDisplay[];
  mandatory?: boolean;
  value_type: 'string' | 'date' | 'number' | 'boolean' | string;
};
// type AttributesMap = Record<string, AttributeDef>;

type CredentialDisplayItem = {
  logo?: { uri: string; alt_text?: string };
  name: string;
  locale?: string;
  description?: string;
  background_image?: { uri: string };
  background_color?: string;
  text_color?: string;
};
type Appearance = {
  display: CredentialDisplayItem[];
};

type CredentialConfig = {
  format: string;
  vct?: string;
  scope: string;
  doctype?: string;

  credential_signing_alg_values_supported: string[] | number[];
  cryptographic_binding_methods_supported: string[];
  proof_types_supported?: Record<string, unknown>;
  credential_definition?: Record<string, unknown>;

  credential_metadata: {
    claims: Claim[];
    display: CredentialDisplayItem[];
  };
};

type CredentialConfigurationsSupported = {
  credentialConfigurationsSupported: Record<string, CredentialConfig>;
};

const ISSUER_DPOP_ALGS_DEFAULT = ['RS256', 'ES256'];

const STATIC_CREDENTIAL_ALGS_FOR_SDJWT = ['ES256'];
const STATIC_BINDING_METHODS_FOR_SDJWT = ['did:key', 'did:web', 'did:jwk', 'jwk'];

const STATIC_CREDENTIAL_ALGS_FOR_MDOC = ['ES256'];
const STATIC_BINDING_METHODS_FOR_MDOC = ['jwk'];

/**
 * Checks if a value is an array of DisplayItem.
 * (Simple runtime check, could be more elaborate)
 */
function isDisplayArray(val: unknown): val is DisplayItem[] {
  return Array.isArray(val);
}

type DisplayItem = {
  name?: string;
  locale?: string;
  logo?: {
    uri: string;
    alt_text?: string;
  };
};

/**
 * Safely coerces a Prisma.JsonValue (from oidc_issuer.metadata) into a JS object.
 */
function coerceJson<T>(val: Prisma.JsonValue): T {
  if (null === val || undefined === val) {
    return {} as T;
  }
  if ('string' === typeof val) {
    try {
      return JSON.parse(val) as T;
    } catch {
      return {} as T;
    }
  }
  return val as T;
}

/**
 * Builder #1: Issuer Metadata Payload
 *
 * Builds the root OIDC Issuer metadata object (including "display", "dpop...", etc.).
 *
 * @param credentialConfigurations The "credential_configurations_supported" block built by Builder #2.
 * @param oidcIssuer               The Prisma row for the OIDC Issuer.
 * @param opts                     Optional overrides: dpopAlgs[], accessTokenSignerKeyType
 */
export function buildIssuerPayload(
  credentialConfigurations: CredentialConfigurationsSupported,
  oidcIssuer: oidc_issuer,
  opts?: {
    dpopAlgs?: string[];
    accessTokenSignerKeyType?: string;
  }
): Record<string, unknown> {
  if (!oidcIssuer?.publicIssuerId || 'string' !== typeof oidcIssuer.publicIssuerId) {
    throw new Error('Invalid issuer: missing publicIssuerId');
  }

  const rawDisplay = coerceJson<unknown>(oidcIssuer.metadata);
  const display: DisplayItem[] = isDisplayArray(rawDisplay) ? rawDisplay : [];

  const batchSize = oidcIssuer?.batchCredentialIssuanceSize ?? batchCredentialIssuanceDefault;

  const payload: Record<string, unknown> = {
    display,
    dpopSigningAlgValuesSupported: opts?.dpopAlgs ?? [...ISSUER_DPOP_ALGS_DEFAULT],
    credentialConfigurationsSupported: credentialConfigurations.credentialConfigurationsSupported ?? {}
  };

  if (0 < batchSize) {
    payload.batchCredentialIssuance = {
      batchSize
    };
  }

  return payload;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateClaims(attributes: CredentialAttribute[], namespace?: string, parentPath: string[] = []): Claim[] {
  const result: Claim[] = [];

  for (const attr of attributes) {
    const currentPath = [...parentPath, attr.key];

    const path = namespace ? [namespace, ...currentPath] : currentPath;

    const claim: Claim = { path };

    if (attr.display) {
      claim.display = attr.display as ClaimDisplay[];
    }

    if (true === attr.mandatory) {
      claim.mandatory = true;
    }

    // Always push the claim (even if it only has path)
    result.push(claim);

    // Handle nested children
    if (attr.children?.length) {
      result.push(...generateClaims(attr.children, namespace, currentPath));
    }
  }

  return result;
}

/**
 * Builds claims object for both SD-JWT and MDOC credential templates.
 */
//TODO: Remove any type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildClaimsFromTemplate(template: SdJwtTemplate | MdocTemplate): Claim[] {
  // ✅ MDOC case — handle namespaces
  if ((template as MdocTemplate).namespaces) {
    const mdocTemplate = template as MdocTemplate;
    //TODO: Remove any type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const claims: Claim[] = [];
    for (const ns of mdocTemplate.namespaces) {
      const generated = generateClaims(ns.attributes, ns.namespace);

      claims.push(...generated);
    }
    return claims;
  }
  // ✅ SD-JWT case — flat attributes
  const sdjwtTemplate = template as SdJwtTemplate;
  const claims = generateClaims(sdjwtTemplate.attributes);
  return claims;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function buildSdJwtCredentialConfig(name: string, template: SdJwtTemplate): Record<string, CredentialConfig> {
  const formatSuffix = 'sdjwt';

  // Determine the unique key for this credential configuration
  const configKey = `${name}-${formatSuffix}`;
  const credentialScope = `openid4vc:${template.vct}-${formatSuffix}`;

  const claims = buildClaimsFromTemplate(template);

  return {
    [configKey]: {
      format: CredentialFormat.SdJwtVc,
      scope: credentialScope,
      vct: template.vct,
      credential_signing_alg_values_supported: [...STATIC_CREDENTIAL_ALGS_FOR_SDJWT],
      cryptographic_binding_methods_supported: [...STATIC_BINDING_METHODS_FOR_SDJWT],
      proof_types_supported: {
        jwt: {
          proof_signing_alg_values_supported: ['ES256', 'EdDSA']
        }
      },
      credential_metadata: {
        claims,
        display: []
      }
    }
  };
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function buildMdocCredentialConfig(name: string, template: MdocTemplate): Record<string, CredentialConfig> {
  //const claims: Claim[] = [];

  const formatSuffix = 'mdoc';

  // Determine the unique key for this credential configuration
  const configKey = `${name}-${formatSuffix}`;
  const credentialScope = `openid4vc:${template.doctype}-${formatSuffix}`;

  const claims = buildClaimsFromTemplate(template);
  // for (const ns of template.namespaces) {
  //   claims.push(...buildClaimsFromAttributes(ns.attributes, [ns.namespace]));
  // }

  return {
    [configKey]: {
      format: CredentialFormat.Mdoc,
      scope: credentialScope,
      doctype: template.doctype,
      credential_signing_alg_values_supported: [...STATIC_CREDENTIAL_ALGS_FOR_MDOC],
      cryptographic_binding_methods_supported: [...STATIC_BINDING_METHODS_FOR_MDOC],
      proof_types_supported: {
        jwt: {
          proof_signing_alg_values_supported: ['ES256', 'EdDSA']
        }
      },
      credential_metadata: {
        claims,
        display: []
      }
    }
  };
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function buildJwtVcJsonLdCredentialConfig(
  name: string,
  template: SdJwtTemplate
): Record<string, CredentialConfig> {
  const formatSuffix = 'jwt-vc-json-ld';

  // Determine the unique key for this credential configuration
  const configKey = `${name}-${formatSuffix}`;
  const credentialScope = `openid4vc:${template.vct}-${formatSuffix}`;

  const claims = buildClaimsFromTemplate(template);

  const { vct } = template;
  let typeName = name ? name.replace(/[^a-zA-Z0-9]/g, '') : 'GenericCredential';
  if ('string' === typeof vct && '' !== vct.trim()) {
    const lastSlash = vct.lastIndexOf('/');
    typeName = -1 !== lastSlash ? vct.substring(lastSlash + 1) : vct;
  }

  return {
    [configKey]: {
      format: CredentialFormat.JwtVcJsonLd,
      scope: credentialScope,
      vct: template.vct,
      credential_signing_alg_values_supported: [...STATIC_CREDENTIAL_ALGS_FOR_SDJWT],
      cryptographic_binding_methods_supported: [...STATIC_BINDING_METHODS_FOR_SDJWT],
      proof_types_supported: {
        jwt: {
          proof_signing_alg_values_supported: ['ES256', 'EdDSA']
        }
      },
      credential_definition: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', typeName]
      },
      credential_metadata: {
        claims,
        display: []
      }
    }
  };
}

//TODO: Fix this eslint issue
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function buildCredentialConfig(
  name: string,
  template: SdJwtTemplate | MdocTemplate,
  format: CredentialFormat
): Record<string, CredentialConfig> {
  switch (format) {
    case CredentialFormat.SdJwtVc:
      return buildSdJwtCredentialConfig(name, template as SdJwtTemplate);
    case CredentialFormat.JwtVcJsonLd:
      return buildJwtVcJsonLdCredentialConfig(name, template as SdJwtTemplate);
    case CredentialFormat.Mdoc:
      return buildMdocCredentialConfig(name, template as MdocTemplate);
    default:
      throw new Error(`Unsupported credential format: ${format}`);
  }
}

/**
 * Build agent payload from Prisma rows (attributes/appearance are Prisma.JsonValue).
 * Safely coerces JSON and then builds the same structure as Builder #2.
 */
export function buildCredentialConfigurationsSupported(templateRows: unknown[]): Record<string, CredentialConfig> {
  const credentialConfigMap: Record<string, CredentialConfig> = {};

  for (const templateRow of templateRows as Record<string, unknown>[]) {
    const format = templateRow.format as string;
    const templateToBuild = templateRow.attributes as SdJwtTemplate | MdocTemplate;

    const credentialConfig = buildCredentialConfig(
      templateRow.name as string,
      templateToBuild,
      format === CredentialFormat.Mdoc
        ? CredentialFormat.Mdoc
        : format === CredentialFormat.JwtVcJsonLd
          ? CredentialFormat.JwtVcJsonLd
          : CredentialFormat.SdJwtVc
    );

    const appearance = coerceJson<Appearance>(templateRow.appearance as Prisma.JsonValue);
    const displayConfigurations: CredentialDisplayItem[] =
      appearance.display?.map((displayEntry) => ({
        name: displayEntry.name,
        locale: displayEntry.locale,
        logo: displayEntry.logo,
        description: displayEntry.description,
        background_image: displayEntry.background_image,
        background_color: displayEntry.background_color,
        text_color: displayEntry.text_color
      })) ?? [];

    // eslint-disable-next-line prefer-destructuring
    const dynamicKey = Object.keys(credentialConfig)[0];
    Object.assign(credentialConfig[dynamicKey].credential_metadata, {
      display: displayConfigurations
    });

    Object.assign(credentialConfigMap, credentialConfig);
  }
  return credentialConfigMap; // ✅ Return flat map, not nested object
}
