/* eslint-disable quotes */
/* eslint-disable no-useless-catch */
/* eslint-disable camelcase */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// utils/issuer-metadata.ts
import type { credential_templates } from '@prisma/client';
import type { CredentialConfiguration, Display } from '../../interfaces/oidc-issuance.interfaces';

// Map our template.format to OIDC4VCI "format"
const mapFormatToOidc = (fmt: 'sd-jwt-vc' | 'mdoc'): 'vc+sd-jwt' | 'mso_mdoc' =>
  'sd-jwt-vc' === fmt ? 'vc+sd-jwt' : 'mso_mdoc';

// Build a stable config id when issuer metadata doesn’t already have one
const configIdFromTemplate = (t: credential_templates): string =>
  `${t.name}-${'sd-jwt-vc' === t.format ? 'sdjwt' : 'mdoc'}`;

// Turn template.attributes into OIDC4VCI "claims" map
// const claimsFromTemplate = (t: credential_templates): CredentialConfiguration['claims'] => {
//   const claims: Record<string, any> = {};
//   const attrs = (t.attributes ?? {}) as Record<
//     string,
//     { mandatory?: boolean; value_type: string; display?: Display[] }
//   >;
//   for (const [key, def] of Object.entries(attrs)) {
//     claims[key] = {
//       // exact field names per your example
//       mandatory: !!def.mandatory,
//       value_type: def.value_type,
//       ...(def.display ? { display: def.display } : {})
//     };
//   }
//   return claims;
// };
const claimsFromTemplate = (t: credential_templates): CredentialConfiguration['claims'] => {
  const claims: Record<string, any> = {};

  // Narrowing: only handle JsonObject
  const raw = t.attributes as unknown;
  if (raw && 'object' === typeof raw && !Array.isArray(raw)) {
    const attrs = raw as Record<string, { mandatory?: boolean; value_type: string; display?: Display[] }>;

    for (const [key, def] of Object.entries(attrs)) {
      claims[key] = {
        mandatory: Boolean(def.mandatory),
        value_type: def.value_type,
        ...(def.display ? { display: def.display } : {})
      };
    }
  }

  return claims;
};

// Minimal issuer-level display from template when needed
const displayFromTemplate = (t: credential_templates): Display[] => {
  const base = {
    name: t.name,
    description: t.description ?? undefined,
    locale: 'en'
  } as Display;
  return [base];
};

/**
 * Compose final issuer metadata:
 * - Start with exact stored issuer.metadata (as returned by agent or stored upon creation)
 * - Upsert credential_configurations_supported entries from templates:
 *     - Keep existing alg/binding/display unless template explicitly provides display
 *     - Replace/define "claims" from template.attributes
 * - Support both keys: "credential_configurations_supported" and legacy "credentials_supported"
 */
export function composeIssuerMetadataExact(issuerMetadata: any, templates: credential_templates[]): Promise<any> {
  if (!issuerMetadata || 'object' !== typeof issuerMetadata) {
    throw new Error('issuerMetadata must be a JSON object');
  }

  // Determine which wrapper key the stored metadata uses
  const WRAPPER_KEY =
    'credential_configurations_supported' in issuerMetadata
      ? 'credential_configurations_supported'
      : 'credentials_supported' in issuerMetadata
        ? 'credentials_supported'
        : 'credential_configurations_supported'; // default to the current spec key

  const out = {
    ...issuerMetadata,
    [WRAPPER_KEY]: { ...(issuerMetadata[WRAPPER_KEY] ?? {}) }
  };

  for (const t of templates) {
    const desiredFormat = mapFormatToOidc(t.format as 'sd-jwt-vc' | 'mdoc');

    // Try to find an existing config to update by matching name+format suffix in keys
    const existingKey =
      Object.keys(out[WRAPPER_KEY]).find((k) => {
        const cfg = out[WRAPPER_KEY][k];
        return (
          'object' === typeof cfg &&
          cfg?.format === desiredFormat &&
          // common conventions: key contains template name and format suffix
          (k === `${t.name}-sdjwt` || k === `${t.name}-mdoc` || k === `${t.name}-${desiredFormat}`)
        );
      }) ?? configIdFromTemplate(t);

    const existingCfg: Partial<CredentialConfiguration> = out[WRAPPER_KEY][existingKey] ?? {};

    // Build the upserted configuration, preserving algs/binding/scope/vct/doctype if they already exist in metadata
    const nextCfg: CredentialConfiguration = {
      format: existingCfg.format ?? desiredFormat,
      // Keep vct/doctype if already present; templates are generic, so we don’t invent them
      vct: existingCfg.vct,
      doctype: existingCfg.doctype,
      scope: existingCfg.scope ?? `openid4vc:credential:${existingKey}`, // safe default if missing
      // Replace claims with the template-derived claims (the truth source for fields)
      claims: claimsFromTemplate(t),

      // Preserve existing algs/binding lists if the stored metadata has them
      credential_signing_alg_values_supported: existingCfg.credential_signing_alg_values_supported ?? [],
      cryptographic_binding_methods_supported: existingCfg.cryptographic_binding_methods_supported ?? [],

      // Prefer existing display; if absent, synthesize from template (name/description)
      display: existingCfg.display && 0 < existingCfg.display.length ? existingCfg.display : displayFromTemplate(t)
    };

    out[WRAPPER_KEY][existingKey] = nextCfg;
  }

  return out;
}
