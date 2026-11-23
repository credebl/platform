import { trim } from '@credebl/common/cast.helper';
import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';

const MAX_PRIVATE_KEY_LENGTH = 20_000;
const MAX_JWE_LENGTH = 200_000;

/**
 * Private key material encrypted to a single-use import session. The envelope is opaque to the platform: only the
 * organization's agent can decrypt it, so it can safely cross the gateway and NATS.
 */
export class EncryptedKeyMaterialDto {
  @ApiProperty({ description: 'Id returned by the key import session endpoint' })
  @IsString({ message: 'encryptedKey.sessionId must be a string.' })
  @IsNotEmpty({ message: 'encryptedKey.sessionId is required.' })
  sessionId: string;

  @ApiProperty({ description: 'Compact JWE containing the private key material' })
  @IsString({ message: 'encryptedKey.jwe must be a string.' })
  @IsNotEmpty({ message: 'encryptedKey.jwe is required.' })
  @MaxLength(MAX_JWE_LENGTH, { message: 'encryptedKey.jwe is too long' })
  jwe: string;
}

export class CreateDidImportSessionDto {
  @ApiProperty({ enum: ['key', 'web', 'x509', 'polygon', 'x509-certificate'], example: 'key' })
  @IsIn(['key', 'web', 'x509', 'polygon', 'x509-certificate'], {
    message: 'method must be one of key, web, x509, polygon, x509-certificate'
  })
  method: 'key' | 'web' | 'x509' | 'polygon' | 'x509-certificate';
}

export class CreateDidDto {
  @ApiProperty({ example: '000000000000000000000000000Seed1' })
  @MaxLength(32, { message: 'seed must be at most 32 characters.' })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @ApiPropertyOptional()
  @IsString({ message: 'seed must be in string format.' })
  @Matches(/^\S*$/, {
    message: 'Spaces are not allowed in seed'
  })
  seed?: string;

  @ApiPropertyOptional({ example: 'ed25519' })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsString({ message: 'key type be in string format.' })
  keyType?: string;

  @ApiProperty({ example: 'indy' })
  @IsNotEmpty({ message: 'method is required' })
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'method must be in string format.' })
  method: string;

  @ApiPropertyOptional({ example: 'bcovrin:testnet' })
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'network must be in string format.' })
  network?: string;

  @ApiPropertyOptional({ example: 'www.github.com' })
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'domain must be in string format.' })
  domain?: string;

  @ApiPropertyOptional({ example: 'endorser' })
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'role must be in string format.' })
  role?: string;

  /**
   * @deprecated Legacy plaintext did:polygon key. Hidden from the OpenAPI document and rejected unless
   * `ALLOW_PLAINTEXT_KEY_IMPORT=true`. Send the key inside `encryptedKey`.
   */
  @ApiHideProperty()
  @IsOptional()
  @IsString({ message: 'private key must be in string format.' })
  @Transform(({ value }) => trim(value))
  privatekey?: string;

  /**
   * @deprecated Legacy plaintext import. Hidden from the OpenAPI document and rejected unless
   * `ALLOW_PLAINTEXT_KEY_IMPORT=true`. Use `encryptedKey`.
   */
  @ApiHideProperty()
  @IsOptional()
  @IsString({ message: 'privateKey must be in string format.' })
  @MaxLength(MAX_PRIVATE_KEY_LENGTH, { message: 'privateKey is too long' })
  privateKey?: string;

  /** @deprecated Legacy plaintext import, see `privateKey`. */
  @ApiHideProperty()
  @IsOptional()
  @IsObject({ message: 'privateKeyJwk must be an object.' })
  privateKeyJwk?: Record<string, unknown>;

  /** @deprecated Legacy plaintext import, see `privateKey`. */
  @ApiHideProperty()
  @IsOptional()
  @IsString({ message: 'passphrase must be in string format.' })
  @MaxLength(1000, { message: 'passphrase is too long' })
  passphrase?: string;

  @ApiPropertyOptional({
    type: EncryptedKeyMaterialDto,
    description:
      'Private key material encrypted to a single-use import session. This is the supported way to import an existing did:key, did:web or did:polygon key.'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EncryptedKeyMaterialDto)
  encryptedKey?: EncryptedKeyMaterialDto;

  @ApiPropertyOptional({ example: 'http://localhost:6006/docs' })
  @IsOptional()
  @IsString({ message: 'endpoint must be in string format.' })
  endpoint?: string;

  @ApiPropertyOptional({ example: 'XzFjo1RTZ2h9UVFCnPUyaQ' })
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'did must be in string format.' })
  did?: string;

  @ApiPropertyOptional({ example: 'did:indy:bcovrin:testnet:UEeW111G1tYo1nEkPwMcF' })
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'endorser did must be in string format.' })
  endorserDid?: string;
}
