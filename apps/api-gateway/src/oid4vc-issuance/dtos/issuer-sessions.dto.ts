/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/naming-convention, @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types, camelcase */
import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
  registerDecorator,
  ValidationOptions,
  ArrayMinSize,
  IsInt,
  Min,
  IsIn,
  IsUrl,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/* ========= Enums ========= */
export enum CredentialFormat {
  SdJwtVc = 'vc+sd-jwt',
  Mdoc = 'mdoc'
}

/* ========= disclosureFrame custom validator ========= */
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
          } // optional
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

/* ========= Auth flow DTOs ========= */
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
    example: 'https://id.example.com/realms/issuer',
    description: 'AS (Authorization Server) base URL'
  })
  @IsUrl({ require_tld: false })
  authorizationServerUrl!: string;
}

/* ========= XOR class-level validator (exactly one config) ========= */
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

/* ========= Request DTOs ========= */
export class CredentialRequestDto {
  @ApiProperty({
    example: 'c49bdee0-d028-4595-85dc-177c85ea391c',
    description: 'Must match credential template id'
  })
  @IsString()
  @IsNotEmpty()
  templateId!: string;

  @ApiProperty({
    description: 'Dynamic claims object',
    example: { name: 'Garry', DOB: '2000-01-01', additionalProp3: 'Africa' },
    type: 'object',
    additionalProperties: true
  })
  @IsObject()
  payload!: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Selective disclosure: claim -> boolean (or nested map)',
    example: { name: true, DOB: true, additionalProp3: false },
    required: false
  })
  @IsOptional()
  @IsDisclosureFrame()
  disclosureFrame?: Record<string, boolean | Record<string, boolean>>;
}

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

  // XOR: exactly one present
  @ApiPropertyOptional({ type: PreAuthorizedCodeFlowConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PreAuthorizedCodeFlowConfigDto)
  preAuthorizedCodeFlowConfig?: PreAuthorizedCodeFlowConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AuthorizationCodeFlowConfigDto)
  authorizationCodeFlowConfig?: AuthorizationCodeFlowConfigDto;

  issuerId?: string;

  // host XOR rule
  @ExactlyOneOf(['preAuthorizedCodeFlowConfig', 'authorizationCodeFlowConfig'], {
    message: 'Provide exactly one of preAuthorizedCodeFlowConfig or authorizationCodeFlowConfig.'
  })
  private readonly _exactlyOne?: unknown;
}

export class GetAllCredentialOfferDto {
  @ApiProperty({ required: false, example: 'credebl university' })
  @IsOptional()
  publicIssuerId: string = '';

  @ApiProperty({ required: false, example: '568345' })
  @IsOptional()
  preAuthorizedCode: string = '';

  // @ApiPropertyOptional({
  //   example: OpenId4VcIssuanceSessionState.OfferCreated,
  //   enum: OpenId4VcIssuanceSessionState,
  //   required: false,
  // })
  // @IsOptional()
  // @IsEnum(OpenId4VcIssuanceSessionState)
  // state?: OpenId4VcIssuanceSessionState;

  @ApiProperty({ required: false, example: 'openid-credential-offer://?credential_offer_uri=http%3A%2F%2.....' })
  @IsOptional()
  credentialOfferUri: string = '';

  @ApiProperty({ required: false, example: 'Bob' })
  @IsOptional()
  authorizationCode: string = '';
}

export class UpdateCredentialRequestDto {
  @ApiPropertyOptional({
    description: 'Issuer metadata (any valid JSON object)',
    type: 'object',
    additionalProperties: true
  })
  @IsOptional()
  @IsObject()
  issuerMetadata?: Record<string, unknown>;

  issuerId?: string;

  credentialOfferId?: string;
}
