/* eslint-disable camelcase */
import { IsString, IsBoolean, IsOptional, IsEnum, ValidateNested, IsObject } from 'class-validator';
import { ApiExtraModels, ApiProperty, getSchemaPath, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DisplayDto } from './oidc-issuer.dto';

export class CredentialAttributeDto {
  @ApiProperty({ required: false, description: 'Whether the attribute is mandatory' })
  @IsOptional()
  @IsBoolean()
  mandatory?: boolean;

  @ApiProperty({ description: 'Type of the attribute value (string, number, date, etc.)' })
  @IsString()
  value_type: string;

  @ApiProperty({ type: [DisplayDto], required: false, description: 'Localized display values' })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DisplayDto)
  display?: DisplayDto[];
}

@ApiExtraModels(CredentialAttributeDto)
export class CreateCredentialTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  name: string;

  @ApiProperty({ required: false, description: 'Optional description for the template' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['sd-jwt-vc', 'mdoc'], description: 'Credential format type' })
  @IsEnum(['sd-jwt-vc', 'mdoc'])
  format: 'sd-jwt-vc' | 'mdoc';

  @ApiProperty({ description: 'Issuer identifier (DID or issuer ID)' })
  @IsString()
  issuer: string;

  @ApiProperty({ default: false, description: 'Indicates whether credentials can be revoked' })
  @IsBoolean()
  canBeRevoked = false;

  // @ApiProperty({
  //   type: 'object',
  //   additionalProperties: { $ref: getSchemaPath(CredentialAttributeDto) },
  //   description: 'Attributes included in the credential template'
  // })
  // // @Type(() => CredentialAttributeDto)
  // @Transform(({ value }) =>
  //   Object.fromEntries(
  //     Object.entries(value || {}).map(([k, v]) => [k, plainToInstance(CredentialAttributeDto, v)])
  //   )
  // )
  // @ValidateNested({ each: true })
  // attributes: Record<string, CredentialAttributeDto>;
  @ApiProperty({
    type: 'object',
    additionalProperties: { $ref: getSchemaPath(CredentialAttributeDto) },
    description: 'Attributes included in the credential template'
  })
  // @Validate(ValidateAttributeKeys)
  // @ValidateNested({ each: true })
  // @Type(() => CredentialAttributeDto)
  // @Transform(({ value }) =>
  //   Object.fromEntries(
  //     Object.entries(value || {}).map(([k, v]) => [k, plainToInstance(CredentialAttributeDto, v)])
  //   )
  // )
  @IsObject()
  attributes: Record<string, CredentialAttributeDto>;

  @ApiProperty({
    type: Object,
    required: false,
    description: 'Appearance configuration for credentials (branding, colors, etc.)'
  })
  @IsOptional()
  @IsObject()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appearance?: Record<string, any>;

  issuerId: string;
}

export class UpdateCredentialTemplateDto extends PartialType(CreateCredentialTemplateDto) {}
