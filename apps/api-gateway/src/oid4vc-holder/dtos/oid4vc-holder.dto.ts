import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class OidcResolveCredentialOfferDto {
  @ApiProperty({ example: 'openid-credential-offer://?credential_offer_uri=...' })
  @IsString()
  @IsNotEmpty()
  credentialOfferUri: string;
}

export class OidcRequestCredentialDto {
  @ApiProperty({ example: 'openid-credential-offer://?credential_offer_uri=...' })
  @IsString()
  @IsNotEmpty()
  credentialOfferUri: string;

  @ApiProperty({ example: ['UniversityDegree'] })
  @IsArray()
  @IsNotEmpty()
  credentialsToRequest: string[];

  @ApiPropertyOptional({ example: '1234' })
  @IsString()
  @IsOptional()
  txCode?: string;
}

export class OidcResolveProofRequestDto {
  @ApiProperty({ example: 'openid-vc-request://?request_uri=...' })
  @IsString()
  @IsNotEmpty()
  proofRequestUri: string;
}

export class OidcAcceptProofRequestDto {
  @ApiProperty({ example: 'openid-vc-request://?request_uri=...' })
  @IsString()
  @IsNotEmpty()
  proofRequestUri: string;
}
