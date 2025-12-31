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
  Validate,
  IsDate
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { dateToSeconds } from '@credebl/common/date-only';

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

export class ValidityInfo {
  @ApiProperty({
    example: '2025-04-23T14:34:09.188Z',
    required: true
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  validFrom: Date;

  @ApiProperty({
    example: '2026-05-03T14:34:09.188Z',
    required: true
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  validUntil: Date;
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
    example: { validFrom: '2025-04-23T14:34:09.188Z', validUntil: '2026-05-03T14:34:09.188Z' },
    required: false
  })
  @IsOptional()
  validityInfo?: ValidityInfo;
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

  @ApiProperty({
    example: 'preAuthorizedCodeFlow',
    enum: ['preAuthorizedCodeFlow', 'authorizationCodeFlow'],
    description: 'Authorization type'
  })
  @IsString()
  @IsIn(['preAuthorizedCodeFlow', 'authorizationCodeFlow'])
  authorizationType!: 'preAuthorizedCodeFlow' | 'authorizationCodeFlow';

  issuerId?: string;
}

export class GetAllCredentialOfferDto {
  @ApiProperty({ required: false, example: 'credebl university' })
  @IsOptional()
  publicIssuerId: string = '';

  @ApiProperty({ required: false, example: '568345' })
  @IsOptional()
  preAuthorizedCode: string = '';

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

export class SignerOptionsDto {
  @IsString()
  @IsIn(['did', 'x5c'], { message: 'method must be either "did" or "x5c"' })
  method: string;

  @IsString()
  @IsOptional()
  did?: string;

  @IsArray()
  @IsOptional()
  x5c?: string[];
}

export class CredentialDto {
  @ApiProperty({
    description: 'Unique ID of the supported credential',
    example: 'DrivingLicenseCredential-mdoc'
  })
  @IsString()
  credentialSupportedId: string;

  @ApiProperty({
    description: 'Signer options for credential issuance',
    example: {
      method: 'x5c',
      x5c: [
        'MIIB3jCCAZCgAwIBAgIQQfBdIK9v3TIzKR+1HjlixDAFBgMrZXAwJDEUMBIGA1UEAxMLRFkgdGVzdCBvcmcxDDAKBgNVBAYTA0lORDAeFw0yNTA5MjQwMDAwMDBaFw0yODA5MjQwMDAwMDBaMCQxFDASBgNVBAMTC0RZIHRlc3Qgb3JnMQwwCgYDVQQGEwNJTkQwKjAFBgMrZXADIQDIkLycOlkHP6+MG4rprj8fyxRfwqhH8Xx9v0XxCd175aOB1zCB1DAdBgNVHQ4EFgQUbqjjbQgbAx3lPjkPBVQwvvF14agwDgYDVR0PAQH/BAQDAgGGMBUGA1UdJQEB/wQLMAkGByiBjF0FAQIwOwYDVR0SBDQwMoIXaHR0cDovL3Rlc3QuZXhhbXBsZS5jb22GF2h0dHA6Ly90ZXN0LmV4YW1wbGUuY29tMDsGA1UdEQQ0MDKCF2h0dHA6Ly90ZXN0LmV4YW1wbGUuY29thhdodHRwOi8vdGVzdC5leGFtcGxlLmNvbTASBgNVHRMBAf8ECDAGAQH/AgEAMAUGAytlcANBALTqC64XSTRUoMmwYbCD/z46U/Je6IeQsh6qq4qXh+wfnMIfJMvLQnG+nMkfeAs3zYAwjK6sCZ/7lHkEJnYObQ4='
      ]
    }
  })
  @ValidateNested()
  @Type(() => SignerOptionsDto)
  signerOptions: SignerOptionsDto;

  @ApiProperty({
    description: 'Credential format type',
    enum: ['mso_mdoc', 'vc+sd-jwt'],
    example: 'mso_mdoc'
  })
  @IsString()
  @IsIn(['mso_mdoc', 'vc+sd-jwt'], { message: 'format must be either "mso_mdoc" or "vc+sd-jwt"' })
  format: string;

  @ApiProperty({
    description: 'Credential payload (namespace data, validity info, etc.)',
    example: [
      {
        namespaces: {
          'org.iso.23220.photoID.1': {
            birth_date: '1970-02-14',
            family_name: 'Müller-Lüdenscheid',
            given_name: 'Ford Praxibetel',
            document_number: 'LA001801M'
          }
        },
        validityInfo: {
          validFrom: '2025-04-23T14:34:09.188Z',
          validUntil: '2026-05-03T14:34:09.188Z'
        }
      },
      {
        full_name: 'Garry',
        address: {
          street_address: 'M.G. Road',
          locality: 'Pune',
          country: 'India'
        },
        iat: 1698151532,
        nbf: dateToSeconds(new Date()),
        exp: dateToSeconds(new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000))
      }
    ]
  })
  @ValidateNested()
  payload: object;
}

export class CreateCredentialOfferD2ADto {
  @ApiProperty({
    description: 'Public identifier of the issuer visible to verifiers and wallets.',
    example: 'dy-gov'
  })
  @IsString()
  publicIssuerId: string;

  @ApiProperty({
    description: 'List of credentials to be issued under this offer.',
    type: [CredentialDto],
    example: [
      {
        credentialSupportedId: 'DrivingLicenseCredential-mdoc',
        signerOptions: {
          method: 'x5c',
          x5c: [
            'MIIB3jCCAZCgAwIBAgIQQfBdIK9v3TIzKR+1HjlixDAFBgMrZXAwJDEUMBIGA1UEAxMLRFkgdGVzdCBvcmcxDDAKBgNVBAYTA0lORDAeFw0yNTA5MjQwMDAwMDBaFw0yODA5MjQwMDAwMDBaMCQxFDASBgNVBAMTC0RZIHRlc3Qgb3JnMQwwCgYDVQQGEwNJTkQwKjAFBgMrZXADIQDIkLycOlkHP6+MG4rprj8fyxRfwqhH8Xx9v0XxCd175aOB1zCB1DAdBgNVHQ4EFgQUbqjjbQgbAx3lPjkPBVQwvvF14agwDgYDVR0PAQH/BAQDAgGGMBUGA1UdJQEB/wQLMAkGByiBjF0FAQIwOwYDVR0SBDQwMoIXaHR0cDovL3Rlc3QuZXhhbXBsZS5jb22GF2h0dHA6Ly90ZXN0LmV4YW1wbGUuY29tMDsGA1UdEQQ0MDKCF2h0dHA6Ly90ZXN0LmV4YW1wbGUuY29thhdodHRwOi8vdGVzdC5leGFtcGxlLmNvbTASBgNVHRMBAf8ECDAGAQH/AgEAMAUGAytlcANBALTqC64XSTRUoMmwYbCD/z46U/Je6IeQsh6qq4qXh+wfnMIfJMvLQnG+nMkfeAs3zYAwjK6sCZ/7lHkEJnYObQ4='
          ]
        },
        format: 'mso_mdoc',
        payload: {
          namespaces: {
            'org.iso.23220.photoID.1': {
              birth_date: '1970-02-14',
              family_name: 'Müller-Lüdenscheid',
              given_name: 'Ford Praxibetel',
              document_number: 'LA001801M'
            }
          },
          validityInfo: {
            validFrom: '2025-04-23T14:34:09.188Z',
            validUntil: '2026-05-03T14:34:09.188Z'
          }
        }
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CredentialDto)
  credentials: CredentialDto[];

  @ApiPropertyOptional({
    description: 'Pre-Authorized Code Flow configuration. Provide this OR authorizationCodeFlowConfig (XOR rule).',
    type: PreAuthorizedCodeFlowConfigDto,
    example: {
      preAuthorizedCode: 'abcd1234xyz',
      txCode: {
        length: 8,
        inputMode: 'numeric'
      },
      userPinRequired: true
    }
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PreAuthorizedCodeFlowConfigDto)
  preAuthorizedCodeFlowConfig?: PreAuthorizedCodeFlowConfigDto;

  @ApiPropertyOptional({
    description: 'Authorization Code Flow configuration. Provide this OR preAuthorizedCodeFlowConfig (XOR rule).',
    type: AuthorizationCodeFlowConfigDto,
    example: {
      clientId: 'wallet-app',
      redirectUri: 'https://wallet.example.org/callback',
      scope: 'openid vc_authn',
      state: 'xyz-987654321'
    }
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AuthorizationCodeFlowConfigDto)
  authorizationCodeFlowConfig?: AuthorizationCodeFlowConfigDto;

  @ApiPropertyOptional({
    description: 'Internal identifier of the issuer (optional, for backend use).',
    example: 'issuer-12345'
  })
  @IsOptional()
  issuerId?: string;

  @ExactlyOneOf(['preAuthorizedCodeFlowConfig', 'authorizationCodeFlowConfig'], {
    message: 'Provide exactly one of preAuthorizedCodeFlowConfig or authorizationCodeFlowConfig.'
  })
  private readonly _exactlyOne?: unknown;
}
