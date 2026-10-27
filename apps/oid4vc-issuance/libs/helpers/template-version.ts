import { BadRequestException } from '@nestjs/common';
import { CredentialFormat } from '@credebl/enum/enum';
import { ResponseMessages } from '@credebl/common/response-messages';
import { buildCredentialContext, DEFAULT_VC_VERSION, VCVersion } from '@credebl/common/vc';
import { MdocTemplate, SdJwtTemplate } from '../../interfaces/oid4vc-template.interfaces';

export function isJsonLdTemplateFormat(format: string | CredentialFormat | undefined): boolean {
  return CredentialFormat.JwtVcJsonLd === format || CredentialFormat.LdpVc === format;
}

/**
 * VC 2.0 is only issued as a `vc+jwt` (VC-JOSE-COSE) credential; the agent cannot sign VC 2.0
 * credentials with JSON-LD proofs yet, so `ldp_vc` templates are limited to VC 1.1.
 */
export function assertVcVersionSupportedForFormat(format: string | CredentialFormat, version: VCVersion): void {
  if (CredentialFormat.LdpVc === format && 'v2' === version) {
    throw new BadRequestException(ResponseMessages.oidcTemplate.error.vcdm2NotSupportedForLdpVc);
  }
}

/**
 * Returns the template with its VC version and the matching `@context` for JSON-LD formats.
 *
 * When `vcVersion` is not provided the template gets `fallbackVersion`: v1.1 for a new template and the
 * stored version when a template is updated, so existing clients keep receiving VC 1.1 credentials.
 */
export function applyTemplateVcVersion<T extends SdJwtTemplate | MdocTemplate>(
  format: string | CredentialFormat,
  template: T,
  fallbackVersion: VCVersion = DEFAULT_VC_VERSION
): T {
  const { vcVersion: requestedVersion, schemaUrl } = template as SdJwtTemplate;

  if (!isJsonLdTemplateFormat(format)) {
    if (requestedVersion) {
      throw new BadRequestException(ResponseMessages.oidcTemplate.error.vcVersionNotSupportedForFormat);
    }
    return template;
  }

  const vcVersion = requestedVersion ?? fallbackVersion;
  assertVcVersionSupportedForFormat(format, vcVersion);

  return {
    ...template,
    vcVersion,
    context: buildCredentialContext(undefined, vcVersion, schemaUrl)
  };
}
