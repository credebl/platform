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
    description: 'Unique identifier of the issuer (usually a short code or DID-based identifier)',
    example: 'credebl-university'
  })
  @IsString({ message: 'issuerId must be a string' })
  issuerId: string;

  @ApiPropertyOptional({
    description: 'Maximum number of credentials that can be issued in a single batch issuance operation',
    example: 100,
    type: Number
  })
  @IsOptional()
  @IsInt({ message: 'batchCredentialIssuanceSize must be an integer' })
  batchCredentialIssuanceSize?: number;

  @ApiProperty({
    description:
      'Localized display information for the issuer — shown in wallet apps or credential metadata display (multi-lingual supported)',
    type: [IssuerDisplayDto],
    example: [
      {
        locale: 'en',
        name: 'Credebl University',
        description: 'Accredited institution issuing verified student credentials',
        logo: {
          uri: 'https://university.example.io/assets/logo-en.svg',
          alt_text: 'Credebl University logo'
        }
      },
      {
        locale: 'de',
        name: 'Credebl Universität',
        description: 'Akkreditierte Institution für digitale Studentenausweise',
        logo: {
          uri: 'https://university.example.io/assets/logo-de.svg',
          alt_text: 'Credebl Universität Logo'
        }
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IssuerDisplayDto)
  display: IssuerDisplayDto[];

  @ApiProperty({
    example: 'https://issuer.example.io',
    description: 'Base URL of the Authorization Server supporting OID4VC issuance flows'
  })
  @IsUrl({ require_tld: false }, { message: 'authorizationServerUrl must be a valid URL' })
  authorizationServerUrl: string;

  @ApiProperty({
    description:
      'Additional configuration details for the authorization server (token endpoint, credential endpoint, grant types, etc.)',
    type: AuthorizationServerConfigDto,
    example: {
      issuer: 'https://example.com/realms/abc',
      clientAuthentication: {
        clientId: 'issuer-server',
        clientSecret: 'issuer-client-secret'
      }
    }
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
