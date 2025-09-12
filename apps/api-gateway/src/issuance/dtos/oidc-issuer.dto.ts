/* eslint-disable camelcase */
import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsObject,
  IsUrl,
  IsNotEmpty,
  IsDefined,
  IsInt
} from 'class-validator';
import { plainToInstance, Transform, Type } from 'class-transformer';

export class ClaimDto {
  @ApiProperty({
    description: 'The unique key for the claim (e.g. email, name)',
    example: 'email'
  })
  @IsString()
  key: string;

  @ApiProperty({
    description: 'The display label for the claim',
    example: 'Email Address'
  })
  @IsString()
  label: string;

  @ApiProperty({
    description: 'Whether this claim is required for issuance',
    example: true
  })
  @IsBoolean()
  required: boolean;
}

export class LogoDto {
  @ApiProperty({
    description: 'URI pointing to the logo image',
    example: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/ABC-2021-LOGO.svg'
  })
  @IsUrl()
  uri: string;

  @ApiProperty({
    description: 'Alternative text for the logo (for accessibility)',
    example: 'ABC Company Logo'
  })
  @IsString()
  alt_text: string;
}

export class DisplayDto {
  @ApiProperty({
    description: 'The locale for display text',
    example: 'en-US'
  })
  @IsString()
  locale: string;

  @ApiProperty({
    description: 'The display name for the credential/claim',
    example: 'Student ID Card'
  })
  @IsString({ message: 'Error from DisplayDto -> name' })
  name: string;

  @ApiPropertyOptional({
    description: 'A short description for the credential/claim',
    example: 'Digital credential issued to enrolled students'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Logo display information for the issuer',
    type: LogoDto
  })
  @IsOptional()
  @Type(() => LogoDto)
  logo?: LogoDto;
}

@ApiExtraModels(ClaimDto)
export class CredentialConfigurationDto {
  @ApiProperty({
    description: 'The format of the credential',
    example: 'jwt_vc_json'
  })
  @IsString()
  @IsDefined({ message: 'format field is required' })
  @IsNotEmpty({ message: 'format property is required' })
  format: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  vct?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  doctype?: string;

  @ApiProperty()
  @IsString()
  scope: string;

  // @ApiProperty({
  //   description: 'List of claims supported in this credential',
  //   type: [ClaimDto],
  // })
  // @IsArray()
  // @ValidateNested({ each: true })
  // @Type(() => ClaimDto)
  // claims: ClaimDto[]
  @ApiProperty({
    description: 'Claims supported by this credential',
    type: 'object',
    additionalProperties: { $ref: getSchemaPath(ClaimDto) }
  })
  @IsObject()
  @ValidateNested({ each: true })
  @Transform(({ value }) =>
    Object.fromEntries(Object.entries(value || {}).map(([k, v]) => [k, plainToInstance(ClaimDto, v)]))
  )
  claims: Record<string, ClaimDto>;

  @ApiProperty({ type: [String] })
  @IsArray()
  credential_signing_alg_values_supported: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  cryptographic_binding_methods_supported: string[];

  @ApiProperty({
    description: 'Localized display information for the credential',
    type: [DisplayDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DisplayDto)
  display: DisplayDto[];
}

// export class AuthorizationServerConfigDto {
//   @ApiProperty({
//     description: 'Authorization server issuer URL',
//     example: 'https://auth.credebl.com',
//   })
//   @IsUrl()
//   issuer: string

//   @ApiPropertyOptional({
//     description: 'Token endpoint of the authorization server',
//     example: 'https://auth.credebl.com/oauth/token',
//   })
//   @IsOptional()
//   @IsUrl()
//   token_endpoint: string

//   @ApiProperty({
//     description: 'Authorization endpoint of the server',
//     example: 'https://auth.credebl.com/oauth/authorize',
//   })
//   @IsUrl()
//   authorization_endpoint: string

//   @ApiProperty({
//     description: 'Supported scopes',
//     example: ['openid', 'profile', 'email'],
//   })
//   @IsArray()
//   @IsString({ each: true })
//   scopes_supported: string[]
// }

export class ClientAuthenticationDto {
  @ApiProperty({
    description: 'OAuth2 client ID for the authorization server',
    example: 'issuer-server'
  })
  @IsString()
  clientId: string;

  @ApiProperty({
    description: 'OAuth2 client secret for the authorization server',
    example: '2qKMWulZpMBzXIdfPO5AEs0xaTaKs1uk'
  })
  @IsString()
  clientSecret: string;
}

export class AuthorizationServerConfigDto {
  @ApiProperty({
    description: 'Authorization server issuer URL',
    example: 'https://example-oidc-provider.com'
  })
  @IsString()
  issuer: string;

  @ApiProperty({
    description: 'Client authentication configuration',
    type: () => ClientAuthenticationDto
  })
  @ValidateNested()
  @Type(() => ClientAuthenticationDto)
  clientAuthentication: ClientAuthenticationDto;
}

export enum AccessTokenSignerKeyType {
  ED25519 = 'ed25519'
}

@ApiExtraModels(CredentialConfigurationDto)
export class IssuerCreationDto {
  @ApiProperty({
    description: 'Name of the issuer',
    example: 'Credebl University'
  })
  @IsString({ message: 'issuerId from IssuerCreationDto -> issuerId, must be a string' })
  issuerId: string;

  @ApiPropertyOptional({
    description: 'Maximum number of credentials that can be issued in a batch',
    example: 50,
    type: Number
  })
  @IsOptional()
  @IsInt({ message: 'batchCredentialIssuanceSize must be an integer' })
  batchCredentialIssuanceSize?: number;

  @ApiProperty({
    description: 'Localized display information for the credential',
    type: [DisplayDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DisplayDto)
  display: DisplayDto[];

  @ApiProperty({
    description: 'Configuration of the authorization server',
    type: AuthorizationServerConfigDto
  })
  @ValidateNested()
  @Type(() => AuthorizationServerConfigDto)
  authorizationServerConfigs: AuthorizationServerConfigDto;
}

export class IssuerUpdationDto {
  issuerId?: string;

  @ApiProperty({
    description: 'accessTokenSignerKeyType',
    example: 'ed25519'
  })
  @IsString({
    message: 'accessTokenSignerKeyType from IssuerCreationDto -> accessTokenSignerKeyType, must be a string'
  })
  accessTokenSignerKeyType: string;

  @ApiProperty({
    description: 'Localized display information for the credential',
    type: [DisplayDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DisplayDto)
  display: DisplayDto[];

  @ApiProperty({
    description: 'batchCredentialIssuanceSize',
    example: '50'
  })
  @ApiPropertyOptional({
    description: 'Maximum number of credentials that can be issued in a batch',
    example: 50,
    type: Number
  })
  @IsOptional()
  @IsInt({ message: 'batchCredentialIssuanceSize must be an integer' })
  batchCredentialIssuanceSize?: number;
}
