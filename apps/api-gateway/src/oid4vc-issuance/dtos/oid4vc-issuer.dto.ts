/* eslint-disable camelcase */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, ValidateNested, IsUrl, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

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

export class IssuerDisplayDto {
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
    description: 'Logo display information for the issuer',
    type: LogoDto
  })
  @IsOptional()
  @Type(() => LogoDto)
  logo?: LogoDto;
}

// TODO: Check where it is used, coz no reference found
// @ApiExtraModels(ClaimDto)
// export class CredentialConfigurationDto {
//   @ApiProperty({
//     description: 'The format of the credential',
//     example: 'jwt_vc_json'
//   })
//   @IsString()
//   @IsDefined({ message: 'format field is required' })
//   @IsNotEmpty({ message: 'format property is required' })
//   format: string;

//   @ApiProperty({ required: false })
//   @IsOptional()
//   @IsString()
//   vct?: string;

//   @ApiProperty({ required: false })
//   @IsOptional()
//   @IsString()
//   doctype?: string;

//   @ApiProperty()
//   @IsString()
//   scope: string;

//   @ApiProperty({
//     description: 'List of claims supported in this credential',
//     type: [ClaimDto]
//   })
//   @IsArray()
//   @ValidateNested({ each: true })
//   @Type(() => ClaimDto)
//   claims: ClaimDto[];
//   // @ApiProperty({
//   //   description: 'Claims supported by this credential',
//   //   type: 'object',
//   //   additionalProperties: { $ref: getSchemaPath(ClaimDto) }
//   // })
//   // @IsObject()
//   // @ValidateNested({ each: true })
//   // @Transform(({ value }) =>
//   //   Object.fromEntries(Object.entries(value || {}).map(([k, v]) => [k, plainToInstance(ClaimDto, v)]))
//   // )
//   // claims: Record<string, ClaimDto>;

//   @ApiProperty({ type: [String] })
//   @IsArray()
//   credential_signing_alg_values_supported: string[];

//   @ApiProperty({ type: [String] })
//   @IsArray()
//   cryptographic_binding_methods_supported: string[];

//   @ApiProperty({
//     description: 'Localized display information for the credential',
//     type: [DisplayDto]
//   })
//   @IsArray()
//   @ValidateNested({ each: true })
//   @Type(() => DisplayDto)
//   display: DisplayDto[];
// }

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
    example: 'https://example-oid4vc-provider.com'
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

// @ApiExtraModels(CredentialConfigurationDto)
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
    type: [IssuerDisplayDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IssuerDisplayDto)
  display: IssuerDisplayDto[];

  @ApiProperty({ example: 'https://auth.example.org', description: 'Authorization URL' })
  @IsUrl({ require_tld: false })
  authorizationServerUrl: string;

  @ApiProperty({
    description: 'Configuration of the authorization server',
    type: AuthorizationServerConfigDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AuthorizationServerConfigDto)
  authorizationServerConfigs?: AuthorizationServerConfigDto;
}

export class IssuerUpdationDto {
  issuerId?: string;

  @ApiProperty({
    description: 'Localized display information for the credential',
    type: [IssuerDisplayDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IssuerDisplayDto)
  display: IssuerDisplayDto[];

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
