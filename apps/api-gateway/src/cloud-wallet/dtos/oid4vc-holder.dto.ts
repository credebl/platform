import { Oid4vcCredentialType } from '@credebl/common/interfaces/cloud-wallet.interface';
import { IsNotSQLInjection, trim } from '@credebl/common/cast.helper';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength
} from 'class-validator';

export class ResolveCredentialOfferDto {
  @ApiProperty({ example: 'openid-credential-offer://?credential_offer=...', description: 'Credential offer URI' })
  @IsString({ message: 'credentialOfferUri must be a string' })
  @IsNotEmpty({ message: 'please provide valid credentialOfferUri' })
  @Transform(({ value }) => trim(value))
  @IsNotSQLInjection({ message: 'credentialOfferUri is required.' })
  credentialOfferUri!: string;

  userId?: string;

  email?: string;
}

export class AuthorizationRequestDto {
  @ApiProperty({ example: 'openid-credential-offer://?credential_offer=...', description: 'Credential offer URI' })
  @IsString({ message: 'credentialOfferUri must be a string' })
  @IsNotEmpty({ message: 'please provide valid credentialOfferUri' })
  @Transform(({ value }) => trim(value))
  @IsNotSQLInjection({ message: 'credentialOfferUri is required.' })
  credentialOfferUri!: string;

  @ApiProperty({
    example: ['UniversityDegreeCredential'],
    description: 'Credential configuration ids to request',
    type: [String]
  })
  @IsArray({ message: 'credentialsToRequest must be an array' })
  @ArrayNotEmpty({ message: 'credentialsToRequest should not be empty' })
  @IsString({ each: true, message: 'credentialsToRequest must be an array of strings' })
  credentialsToRequest!: string[];

  userId?: string;

  email?: string;
}

export class RequestCredentialDto {
  @ApiProperty({ example: 'openid-credential-offer://?credential_offer=...', description: 'Credential offer URI' })
  @IsString({ message: 'credentialOfferUri must be a string' })
  @IsNotEmpty({ message: 'please provide valid credentialOfferUri' })
  @Transform(({ value }) => trim(value))
  @IsNotSQLInjection({ message: 'credentialOfferUri is required.' })
  credentialOfferUri!: string;

  @ApiProperty({
    example: ['UniversityDegreeCredential'],
    description: 'Credential configuration ids to request',
    type: [String]
  })
  @IsArray({ message: 'credentialsToRequest must be an array' })
  @ArrayNotEmpty({ message: 'credentialsToRequest should not be empty' })
  @IsString({ each: true, message: 'credentialsToRequest must be an array of strings' })
  credentialsToRequest!: string[];

  @ApiPropertyOptional({ example: 'authorization-code', description: 'Authorization code from the issuer' })
  @IsOptional()
  @IsString({ message: 'authorizationCode must be a string' })
  @Transform(({ value }) => trim(value))
  authorizationCode?: string;

  @ApiPropertyOptional({ example: 'pkce-code-verifier', description: 'PKCE code verifier' })
  @IsOptional()
  @IsString({ message: 'codeVerifier must be a string' })
  @Transform(({ value }) => trim(value))
  codeVerifier?: string;

  @ApiPropertyOptional({ example: '123456', description: 'Transaction code (pre-authorized code flow)' })
  @IsOptional()
  @IsString({ message: 'txCode must be a string' })
  @Transform(({ value }) => trim(value))
  txCode?: string;

  @ApiPropertyOptional({
    example: 'did:web:example.com:holders:alice#key-1',
    description:
      'DID URL of a DID in the wallet. The credentials are bound to its key instead of a new key, for example a did:web whose key was imported from the holder certificate'
  })
  @IsOptional()
  @IsString({ message: 'holderDidUrl must be a string' })
  @Transform(({ value }) => trim(value))
  @Matches(/^did:[a-z0-9]+:\S+$/i, { message: 'holderDidUrl must be a DID or DID URL' })
  @MaxLength(2048, { message: 'holderDidUrl must be at most 2048 characters' })
  holderDidUrl?: string;

  @ApiPropertyOptional({
    enum: ['require', 'prefer'],
    example: 'require',
    description:
      'Used with holderDidUrl. require (default) fails when the issuer cannot bind to the DID; prefer falls back to a new key'
  })
  @IsOptional()
  @IsIn(['require', 'prefer'], { message: 'bindingPolicy must be one of require, prefer' })
  bindingPolicy?: 'require' | 'prefer';

  @ApiPropertyOptional({
    example: true,
    description: 'Send the credential_accepted notification to the issuer. Defaults to true.'
  })
  @IsOptional()
  @IsBoolean({ message: 'sendNotification must be a boolean' })
  sendNotification?: boolean;

  userId?: string;

  email?: string;
}

export class ResolveProofRequestDto {
  @ApiProperty({ example: 'openid4vp://?request_uri=...', description: 'Proof request URI' })
  @IsString({ message: 'proofRequestUri must be a string' })
  @IsNotEmpty({ message: 'please provide valid proofRequestUri' })
  @Transform(({ value }) => trim(value))
  @IsNotSQLInjection({ message: 'proofRequestUri is required.' })
  proofRequestUri!: string;

  @ApiPropertyOptional({ description: 'OpenID4VP authorization request options' })
  @IsOptional()
  @IsObject({ message: 'options must be an object' })
  options?: object;

  userId?: string;

  email?: string;
}

export class AcceptOid4vpProofRequestDto {
  @ApiProperty({ example: 'openid4vp://?request_uri=...', description: 'Proof request URI' })
  @IsString({ message: 'proofRequestUri must be a string' })
  @IsNotEmpty({ message: 'please provide valid proofRequestUri' })
  @Transform(({ value }) => trim(value))
  @IsNotSQLInjection({ message: 'proofRequestUri is required.' })
  proofRequestUri!: string;

  @ApiPropertyOptional({ description: 'OpenID4VP authorization request options' })
  @IsOptional()
  @IsObject({ message: 'options must be an object' })
  options?: object;

  userId?: string;

  email?: string;
}

export class DecodeMdocDto {
  @ApiProperty({ description: 'Base64URL encoded mDoc' })
  @IsString({ message: 'base64Url must be a string' })
  @IsNotEmpty({ message: 'please provide valid base64Url' })
  @Transform(({ value }) => trim(value))
  base64Url!: string;

  userId?: string;

  email?: string;
}

export class DecodeSdJwtDto {
  @ApiProperty({ description: 'SD-JWT to decode' })
  @IsString({ message: 'jwt must be a string' })
  @IsNotEmpty({ message: 'please provide valid jwt' })
  @Transform(({ value }) => trim(value))
  jwt!: string;

  userId?: string;

  email?: string;
}

export class DeleteHolderCredentialDto {
  @ApiProperty({ enum: Oid4vcCredentialType, example: Oid4vcCredentialType.SD_JWT_VC, description: 'Credential type' })
  @IsEnum(Oid4vcCredentialType, { message: 'credentialType must be one of sd-jwt-vc, mso_mdoc, w3c-vc' })
  @IsNotEmpty({ message: 'please provide valid credentialType' })
  credentialType!: Oid4vcCredentialType;

  @ApiProperty({ example: 'credential-id', description: 'Credential identifier' })
  @IsString({ message: 'credentialId must be a string' })
  @IsNotEmpty({ message: 'please provide valid credentialId' })
  @Transform(({ value }) => trim(value))
  @IsNotSQLInjection({ message: 'credentialId is required.' })
  credentialId!: string;

  userId?: string;

  email?: string;
}
