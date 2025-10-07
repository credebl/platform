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
  IsEmpty
} from 'class-validator';
import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DisplayDto } from './oid4vc-issuer.dto';

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

export enum SignerOption {
  DID = 'did',
  X509 = 'x509'
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

  @ApiProperty({
    description: 'Signer option (did or x509)',
    enum: SignerOption,
    example: SignerOption.DID
  })
  @IsEnum(SignerOption)
  signerOption!: SignerOption;

  @ApiProperty({ enum: ['mso_mdoc', 'vc+sd-jwt'], description: 'Credential format type' })
  @IsEnum(['mso_mdoc', 'vc+sd-jwt'])
  format: 'mso_mdoc' | 'vc+sd-jwt';

  @ApiPropertyOptional({
    description: 'Document type (required when format is "mso_mdoc"; must NOT be provided when format is "vc+sd-jwt")',
    example: 'org.iso.23220.photoID.1'
  })
  @ValidateIf((o: CreateCredentialTemplateDto) => 'mso_mdoc' === o.format)
  @IsString()
  doctype?: string;

  @ValidateIf((o: CreateCredentialTemplateDto) => 'vc+sd-jwt' === o.format)
  @IsEmpty({ message: 'doctype must not be provided when format is "vc+sd-jwt"' })
  readonly _doctypeAbsentGuard?: unknown;

  @ApiPropertyOptional({
    description:
      'Verifiable Credential Type (required when format is "vc+sd-jwt"; must NOT be provided when format is "mso_mdoc")',
    example: 'BirthCertificateCredential-sdjwt'
  })
  @ValidateIf((o: CreateCredentialTemplateDto) => 'vc+sd-jwt' === o.format)
  @IsString()
  vct?: string;

  @ValidateIf((o: CreateCredentialTemplateDto) => 'mso_mdoc' === o.format)
  @IsEmpty({ message: 'vct must not be provided when format is "mso_mdoc"' })
  readonly _vctAbsentGuard?: unknown;

  @ApiProperty({ default: false, description: 'Indicates whether credentials can be revoked' })
  @IsBoolean()
  canBeRevoked = false;

  @ApiProperty({
    type: 'object',
    additionalProperties: { $ref: getSchemaPath(CredentialAttributeDto) },
    description: 'Attributes included in the credential template'
  })
  @IsObject()
  attributes: Record<string, CredentialAttributeDto>;

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
        },
        {
          locale: 'ar',
          name: 'شهادة الميلاد',
          description: 'سجل رسمي للولادة',
          logo: {
            uri: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/ABC-2021-LOGO.svg',
            alt_text: 'شعار abc'
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
