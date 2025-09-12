/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/naming-convention, @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types, camelcase */

import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
  registerDecorator,
  ValidationOptions,
  IsInt,
  Min,
  IsIn,
  ArrayMinSize,
  IsUrl,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum CredentialFormat {
  SdJwtVc = 'vc+sd-jwt',
  Mdoc = 'mdoc'
}

export enum SignerMethodOption {
  DID = 'did',
  X5C = 'x5c'
}

/** ---------- custom validator: disclosureFrame ---------- */
function isDisclosureFrameValue(v: unknown): boolean {
  if ('boolean' === typeof v) {
    return true;
  }
  if (v && 'object' === typeof v && !Array.isArray(v)) {
    return Object.values(v as Record<string, unknown>).every((x) => 'boolean' === typeof x);
  }
  return false;
}

export function IsDisclosureFrame(options?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      name: 'IsDisclosureFrame',
      target: (object as object).constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown) {
          if (value === undefined) {
            return true;
          }
          if (!value || 'object' !== typeof value || Array.isArray(value)) {
            return false;
          }
          return Object.values(value as Record<string, unknown>).every(isDisclosureFrameValue);
        },
        defaultMessage() {
          return 'disclosureFrame must be a map of booleans or nested maps of booleans';
        }
      }
    });
  };
}

/** ---------- payload DTOs ---------- */
export class CredentialPayloadDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vct?: string;

  @ApiPropertyOptional({ example: 'Garry' })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiPropertyOptional({ example: '2000-01-01', description: 'YYYY-MM-DD' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'birth_date must be YYYY-MM-DD' })
  birth_date?: string;

  @ApiPropertyOptional({ example: 'Africa' })
  @IsOptional()
  @IsString()
  birth_place?: string;

  @ApiPropertyOptional({ example: 'James Bear' })
  @IsOptional()
  @IsString()
  parent_names?: string;

  [key: string]: unknown;
}

export class CredentialRequestDto {
  @ApiProperty({ example: '1b2d3c4e-...' })
  @IsString()
  @IsNotEmpty()
  templateId!: string;

  @ApiProperty({ enum: CredentialFormat, example: CredentialFormat.SdJwtVc })
  @IsEnum(CredentialFormat)
  format!: CredentialFormat;

  @ApiProperty({
    type: CredentialPayloadDto,
    description: 'Credential payload (structure depends on the format)'
  })
  @ValidateNested()
  @Type(() => CredentialPayloadDto)
  payload!: CredentialPayloadDto;

  @ApiPropertyOptional({
    description: 'Selective disclosure frame (claim -> boolean or nested map).',
    example: { full_name: true, birth_date: true, birth_place: false, parent_names: false },
    required: false
  })
  @IsOptional()
  @IsObject()
  @IsDisclosureFrame()
  disclosureFrame?: Record<string, boolean | Record<string, boolean>>;
}

/** ---------- auth-config DTOs ---------- */
export class TxCodeDto {
  @ApiPropertyOptional({ example: 'test abc' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(1)
  length!: number;

  @ApiProperty({ example: 'numeric', enum: ['numeric'] })
  @IsString()
  @IsIn(['numeric'])
  input_mode!: 'numeric';
}

export class PreAuthorizedCodeFlowConfigDto {
  @ApiProperty({ type: TxCodeDto })
  @ValidateNested()
  @Type(() => TxCodeDto)
  txCode!: TxCodeDto;

  @ApiProperty({
    example: 'http://localhost:4001/oid4vci/abc-gov',
    description: 'AS (Authorization Server) base URL'
  })
  @IsUrl({ require_tld: false })
  authorizationServerUrl!: string;
}

export class AuthorizationCodeFlowConfigDto {
  @ApiProperty({
    example: 'https://id.credebl.ae:8443/realms/credebl',
    description: 'AS (Authorization Server) base URL'
  })
  @IsUrl({ require_tld: false })
  authorizationServerUrl!: string;
}

/** ---------- class-level constraint: EXACTLY ONE of the two configs ---------- */
@ValidatorConstraint({ name: 'ExactlyOneOf', async: false })
class ExactlyOneOfConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments) {
    const obj = args.object as Record<string, unknown>;
    const keys = (args.constraints ?? []) as string[];
    const present = keys.filter((k) => obj[k] !== undefined && null !== obj[k]);
    return 1 === present.length;
  }
  defaultMessage(args: ValidationArguments) {
    const keys = (args.constraints ?? []) as string[];
    return `Exactly one of [${keys.join(', ')}] must be provided (not both, not neither).`;
  }
}
function ExactlyOneOf(keys: string[], options?: ValidationOptions) {
  return Validate(ExactlyOneOfConstraint, keys, options);
}

/** ---------- root DTO (no authenticationType) ---------- */
export class CreateOidcCredentialOfferDto {
  @ApiProperty({
    type: [CredentialRequestDto],
    description: 'At least one credential to be issued.'
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CredentialRequestDto)
  credentials!: CredentialRequestDto[];

  // Each is optional individually; XOR rule below enforces exactly one present.
  @ApiPropertyOptional({ type: PreAuthorizedCodeFlowConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PreAuthorizedCodeFlowConfigDto)
  preAuthorizedCodeFlowConfig?: PreAuthorizedCodeFlowConfigDto;

  @ApiPropertyOptional({ type: AuthorizationCodeFlowConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AuthorizationCodeFlowConfigDto)
  authorizationCodeFlowConfig?: AuthorizationCodeFlowConfigDto;

  issuerId?: string;

  // Host the class-level XOR validator on a dummy property
  @ExactlyOneOf(['preAuthorizedCodeFlowConfig', 'authorizationCodeFlowConfig'], {
    message: 'Provide exactly one of preAuthorizedCodeFlowConfig or authorizationCodeFlowConfig.'
  })
  private readonly _exactlyOne?: unknown;
}
