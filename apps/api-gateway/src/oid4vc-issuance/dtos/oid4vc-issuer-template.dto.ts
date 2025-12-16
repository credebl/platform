/* eslint-disable camelcase */
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsObject,
  IsNotEmpty,
  IsArray,
  ValidateIf,
  IsEmpty,
  ArrayNotEmpty,
  IsDefined,
  NotEquals
} from 'class-validator';
import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SignerOption } from '@prisma/client';
import { AttributeType, CredentialFormat } from '@credebl/enum/enum';

class CredentialAttributeDisplayDto {
  @ApiPropertyOptional({ example: 'First Name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'en' })
  @IsString()
  @IsOptional()
  locale?: string;
}
export class CredentialAttributeDto {
  @ApiProperty({ description: 'Unique key for this attribute (e.g., full_name, org.iso.23220.photoID.1.birth_date)' })
  @IsString()
  key: string;

  @ApiProperty({ required: false, description: 'Whether the attribute is mandatory' })
  @IsOptional()
  @IsBoolean()
  mandatory?: boolean;

  // TODO: Check how do we handle claims with only path rpoperty like email, etc.
  @ApiProperty({ enum: AttributeType, description: 'Type of the attribute value (string, number, date, boolean)' })
  @IsEnum(AttributeType)
  // TODO: changes value_type: AttributeType;
  value_type: AttributeType;

  @ApiProperty({ description: 'Whether this attribute should be disclosed (for SD-JWT)' })
  @IsOptional()
  @IsBoolean()
  disclose?: boolean;

  @ApiProperty({ type: [CredentialAttributeDisplayDto], required: false, description: 'Localized display values' })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CredentialAttributeDisplayDto)
  display?: CredentialAttributeDisplayDto[];

  @ApiProperty({
    description: 'Nested attributes if type is object or array',
    required: false,
    type: () => [CredentialAttributeDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CredentialAttributeDto)
  children?: CredentialAttributeDto[];
}
class LogoDto {
  @ApiPropertyOptional({
    example: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/ABC-2021-LOGO.svg'
  })
  @IsString()
  @IsNotEmpty()
  uri: string;

  @ApiPropertyOptional({ example: 'abc_logo' })
  @IsString()
  @IsOptional()
  alt_text?: string;
}

class CredentialDisplayDto {
  @ApiPropertyOptional({ example: 'Birth Certificate' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Official record of birth' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'en' })
  @IsString()
  @IsOptional()
  locale?: string;

  @ApiPropertyOptional({
    example: {
      uri: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/ABC-2021-LOGO.svg',
      alt_text: 'abc_logo'
    }
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LogoDto)
  logo?: LogoDto;

  @ApiPropertyOptional({ example: '#12107c' })
  @IsString()
  @IsOptional()
  background_color?: string;

  @ApiPropertyOptional({ example: '#FFFFFF' })
  @IsString()
  @IsOptional()
  text_color?: string;

  @ApiPropertyOptional({ example: { uri: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/ABC-2021-LOGO.svg' } })
  @IsObject()
  @IsOptional()
  background_image?: {
    uri: string;
  };
}

export class AppearanceDto {
  @ApiPropertyOptional({
    example: [
      {
        locale: 'de',
        name: 'Geburtsurkunde',
        description: 'Offizielle Geburtsbescheinigung',
        logo: {
          uri: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/ABC-2021-LOGO.svg',
          alt_text: 'abc_logo'
        }
      },
      {
        locale: 'en',
        name: 'Birth Certificate',
        description: 'Official record of birth',
        logo: {
          uri: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/ABC-2021-LOGO.svg',
          alt_text: 'abc_logo'
        }
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CredentialDisplayDto)
  display: CredentialDisplayDto[];
}

export class MdocNamespaceDto {
  @ApiProperty({ description: 'Namespace key (e.g., org.iso.23220.photoID.1)' })
  @IsString()
  namespace: string;

  @ApiProperty({ type: () => [CredentialAttributeDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CredentialAttributeDto)
  attributes: CredentialAttributeDto[];
}
export class MdocTemplateDto {
  @ApiProperty({
    description: 'Document type (required when format is "mso_mdoc"; must NOT be provided when format is "vc+sd-jwt")',
    example: 'org.iso.23220.photoID.1'
  })
  //@ValidateIf((o: CreateCredentialTemplateDto) => 'mso_mdoc' === o.format)
  @IsString()
  doctype: string;

  @ApiProperty({ type: () => [MdocNamespaceDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => MdocNamespaceDto)
  namespaces: MdocNamespaceDto[];
}

export class SdJwtTemplateDto {
  @ApiProperty({
    description:
      'Verifiable Credential Type (required when format is "vc+sd-jwt"; must NOT be provided when format is "mso_mdoc")',
    example: 'BirthCertificateCredential-sdjwt'
  })
  // @ValidateIf((o: CreateCredentialTemplateDto) => 'vc+sd-jwt' === o.format)
  @IsString()
  vct: string;

  @ApiProperty({
    type: 'array',
    items: { $ref: getSchemaPath(CredentialAttributeDto) },
    description: 'Attributes included in the credential template'
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CredentialAttributeDto)
  attributes: CredentialAttributeDto[];
}

@ApiExtraModels(CredentialAttributeDto, SdJwtTemplateDto, MdocTemplateDto)
export class CreateCredentialTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  name: string;

  @ApiProperty({ required: false, description: 'Optional description for the template' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: SignerOption, description: 'Signer option type' })
  @IsEnum(SignerOption)
  @ValidateIf((o) => o.format === CredentialFormat.Mdoc)
  @IsDefined({ message: 'signerOption is required when format is Mdoc' })
  @NotEquals(SignerOption.DID, { message: 'signerOption must NOT be DID when format is Mdoc' })
  signerOption!: SignerOption;

  @ApiProperty({ enum: CredentialFormat, description: 'Credential format type' })
  @IsEnum(CredentialFormat)
  format: CredentialFormat;

  @ValidateIf((o: CreateCredentialTemplateDto) => CredentialFormat.SdJwtVc === o.format)
  @IsEmpty({ message: 'doctype must not be provided when format is "vc+sd-jwt"' })
  readonly _doctypeAbsentGuard?: unknown;

  @ValidateIf((o: CreateCredentialTemplateDto) => CredentialFormat.Mdoc === o.format)
  @IsEmpty({ message: 'vct must not be provided when format is "mso_mdoc"' })
  readonly _vctAbsentGuard?: unknown;

  @ApiProperty({
    type: Object,
    oneOf: [{ $ref: getSchemaPath(SdJwtTemplateDto) }, { $ref: getSchemaPath(MdocTemplateDto) }],
    description: 'Credential template definition (depends on credentialFormat)'
  })
  @ValidateNested()
  @Type(({ object }) => {
    if (object.format === CredentialFormat.Mdoc) {
      return MdocTemplateDto;
    } else if (object.format === CredentialFormat.SdJwtVc) {
      return SdJwtTemplateDto;
    }
  })
  template: SdJwtTemplateDto | MdocTemplateDto;

  @ApiProperty({ default: false, description: 'Indicates whether credentials can be revoked' })
  @IsBoolean()
  canBeRevoked = false;

  @ApiProperty({
    type: Object,
    required: false,
    description: 'Appearance configuration for credentials (branding, colors, etc.)'
  })
  @ApiPropertyOptional({
    type: AppearanceDto,
    example: {
      display: [
        {
          locale: 'en',
          name: 'Birth Certificate',
          description: 'Official record of birth',
          logo: {
            uri: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/ABC-2021-LOGO.svg',
            alt_text: 'abc_logo'
          }
        }
      ]
    }
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AppearanceDto)
  appearance?: AppearanceDto;

  issuerId: string;
}

export class UpdateCredentialTemplateDto extends PartialType(CreateCredentialTemplateDto) {}
