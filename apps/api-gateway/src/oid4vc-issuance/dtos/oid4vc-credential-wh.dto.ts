import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsObject, IsString } from 'class-validator';

export class CredentialOfferPayloadDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  // eslint-disable-next-line camelcase
  credential_configuration_ids!: string[];
}

export class IssuanceMetadataDto {
  @ApiProperty()
  @IsString()
  issuerDid!: string;

  @ApiProperty({ type: [Object] })
  @IsArray()
  credentials!: Record<string, unknown>[];
}

export class OidcIssueCredentialDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsString()
  credentialOfferId!: string;

  @ApiProperty({ type: [Object] })
  @IsArray()
  issuedCredentials!: Record<string, unknown>[];

  @ApiProperty({ type: CredentialOfferPayloadDto })
  @IsObject()
  credentialOfferPayload!: CredentialOfferPayloadDto;

  @ApiProperty()
  @IsString()
  state!: string;

  @ApiProperty()
  @IsString()
  createdAt!: string;

  @ApiProperty()
  @IsString()
  updatedAt!: string;

  @ApiProperty()
  @IsString()
  contextCorrelationId!: string;

  @ApiProperty()
  @IsString()
  issuerId!: string;
}

/**
 * Utility: return only credential_configuration_ids from a webhook payload
 */
export function extractCredentialConfigurationIds(payload: Partial<OidcIssueCredentialDto>): string[] {
  const cfg = payload?.credentialOfferPayload?.credential_configuration_ids;
  return Array.isArray(cfg) ? cfg : [];
}

export function sanitizeOidcIssueCredentialDto(
  payload: Partial<OidcIssueCredentialDto>
): Partial<OidcIssueCredentialDto> {
  const ids = extractCredentialConfigurationIds(payload);
  return {
    ...payload,
    credentialOfferPayload: {
      // eslint-disable-next-line camelcase
      credential_configuration_ids: ids
    }
  };
}
