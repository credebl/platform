/* eslint-disable camelcase */
import { oidc_issuer, Prisma } from '@prisma/client';
import { batchCredentialIssuanceDefault } from '../../constant/issuance';
import { CreateOidcCredentialOffer } from '../../interfaces/oid4vc-issuer-sessions.interfaces';
import { IssuerResponse } from 'apps/oid4vc-issuance/interfaces/oid4vc-issuance.interfaces';
import {
  Claim,
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
};
type Appearance = {
  display: CredentialDisplayItem[];
};

// type Claim = {
//   mandatory?: boolean;
//   // value_type: string;
//   path: string[];
//   display?: AttributeDisplay[];
// };

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
// function isAttributesMap(x: any): x is AttributesMap {
//   return x && 'object' === typeof x && Array.isArray(x);
// }
// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// function isAppearance(x: any): x is Appearance {
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   return x && 'object' === typeof x && Array.isArray((x as any).display);
// }

// // Prisma row shape
// type TemplateRowPrisma = {
//   id: string;
//   name: string;
//   description?: string | null;
//   format?: string | null;
//   canBeRevoked?: boolean | null;
//   attributes: Prisma.JsonValue; // JsonValue from DB
//   appearance: Prisma.JsonValue; // JsonValue from DB
//   issuerId: string;
//   createdAt?: Date | string;
//   updatedAt?: Date | string;
// };

// Prisma row shape
//TODO: Fix this eslint issue
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type TemplateRowPrisma = {
  id: string;
  name: string;
  description?: string | null;
  format?: string | null;
  canBeRevoked?: boolean | null;
  attributes: SdJwtTemplate | MdocTemplate; // JsonValue from DB
  appearance: Prisma.JsonValue; // JsonValue from DB
  issuerId: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

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
  credentialConfigurations: CredentialConfigurationsSupported,
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

  return {
    display,
    dpopSigningAlgValuesSupported: opts?.dpopAlgs ?? [...ISSUER_DPOP_ALGS_DEFAULT],
    credentialConfigurationsSupported: credentialConfigurations.credentialConfigurationsSupported ?? {},
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

///---------------------------------------------------------

// function buildClaimsFromAttributesWithPath(attributes: CredentialAttribute[], parentPath: string[] = []): Claim[] {
//   const claims: Claim[] = [];

//   for (const attr of attributes) {
//     const currentPath = [...parentPath, attr.key];

//     // 1️⃣ Add the parent attribute itself if it has display or mandatory metadata
//     if ((attr.display && 0 < attr.display.length) || attr.mandatory) {
//       const parentClaim: Claim = { path: currentPath };

//       if (attr.display?.length) {
//         parentClaim.display = attr.display.map((d) => ({
//           name: d.name,
//           locale: d.locale
//         }));
//       }

//       if (attr.mandatory) {
//         parentClaim.mandatory = true;
//       }

//       claims.push(parentClaim);
//     }

//     // 2️⃣ If this attribute has nested children, recurse into them
//     if (attr.children && 0 < attr.children.length) {
//       claims.push(...buildClaimsFromAttributes(attr.children, currentPath));
//     }
//   }
//   return claims;
// }

/**
 * Recursively builds a nested claims object from a list of attributes.
 */
function buildNestedClaims(attributes: CredentialAttribute[]): Record<string, Claim> {
  const claims: Record<string, Claim> = {};

  for (const attr of attributes) {
    const node: Claim = {};

    // ✅ include display info
    if (attr.display?.length) {
      node.display = attr.display.map((d) => ({
        name: d.name,
        locale: d.locale
      }));
    }

    // ✅ include mandatory flag
    if (attr.mandatory) {
      node.mandatory = true;
    }

    // ✅ handle nested children recursively
    if (attr.children?.length) {
      const childClaims = buildNestedClaims(attr.children);
      Object.assign(node, childClaims); // merge children into current node
    }

    claims[attr.key] = node;
  }

  return claims;
}

/**
 * Builds claims object for both SD-JWT and MDOC credential templates.
 */
//TODO: Remove any type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildClaimsFromTemplate(template: SdJwtTemplate | MdocTemplate): Record<string, any> {
  // ✅ MDOC case — handle namespaces
  if ((template as MdocTemplate).namespaces) {
    const mdocTemplate = template as MdocTemplate;

    //TODO: Remove any type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const claims: Record<string, any> = {};

    for (const ns of mdocTemplate.namespaces) {
      claims[ns.namespace] = buildNestedClaims(ns.attributes);
    }

    return claims;
  }

  // ✅ SD-JWT case — flat attributes
  const sdjwtTemplate = template as SdJwtTemplate;
  return buildNestedClaims(sdjwtTemplate.attributes);
}

//TODO: Fix this eslint issue
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function buildSdJwtCredentialConfig(name: string, template: SdJwtTemplate) {
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
      credential_signing_alg_values_supported: [...STATIC_CREDENTIAL_ALGS],
      cryptographic_binding_methods_supported: [...STATIC_BINDING_METHODS],
      // proof_types_supported: {
      //   jwt: {
      //     proof_signing_alg_values_supported: ['ES256']
      //   }
      // },
      claims
    }
  };
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function buildMdocCredentialConfig(name: string, template: MdocTemplate) {
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
      credential_signing_alg_values_supported: [...STATIC_CREDENTIAL_ALGS],
      cryptographic_binding_methods_supported: [...STATIC_BINDING_METHODS],
      claims
    }
  };
}

//TODO: Fix this eslint issue
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function buildCredentialConfig(name: string, template: SdJwtTemplate | MdocTemplate, format: CredentialFormat) {
  switch (format) {
    case CredentialFormat.SdJwtVc:
      return buildSdJwtCredentialConfig(name, template as SdJwtTemplate);
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
//TODO: Fix this eslint issue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildCredentialConfigurationsSupported(templateRows: any): Record<string, CredentialConfig> {
  const credentialConfigMap: Record<string, CredentialConfig> = {};

  for (const templateRow of templateRows) {
    const { format } = templateRow;
    const templateToBuild = templateRow.attributes;

    const credentialConfig = buildCredentialConfig(
      templateRow.name,
      templateToBuild,
      format === CredentialFormat.Mdoc ? CredentialFormat.Mdoc : CredentialFormat.SdJwtVc
    );

    const appearanceJson = coerceJsonObject<unknown>(templateRow.appearance);

    // Prepare the display configuration
    const displayConfigurations =
      (appearanceJson as Appearance).display?.map((displayEntry) => ({
        name: displayEntry.name,
        description: displayEntry.description,
        locale: displayEntry.locale,
        logo: displayEntry.logo
          ? {
              uri: displayEntry.logo.uri,
              alt_text: displayEntry.logo.alt_text
            }
          : undefined
      })) ?? [];

    // eslint-disable-next-line prefer-destructuring
    const dynamicKey = Object.keys(credentialConfig)[0];
    Object.assign(credentialConfig[dynamicKey], {
      display: displayConfigurations
    });

    Object.assign(credentialConfigMap, credentialConfig);
  }

  return credentialConfigMap; // ✅ Return flat map, not nested object
}
