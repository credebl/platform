import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsObject, IsString } from 'class-validator';

export class CredentialOfferPayloadDto {
  @ApiProperty()
  @IsString()
  // eslint-disable-next-line camelcase
  credential_issuer!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  // eslint-disable-next-line camelcase
  credential_configuration_ids!: string[];

  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  grants!: Record<string, unknown>;

  @ApiProperty({ type: [Object] })
  @IsArray()
  credentials!: Record<string, unknown>[];
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

  @ApiProperty()
  @IsString()
  state!: string;

  @ApiProperty()
  @IsString()
  contextCorrelationId!: string;
}
