import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
  ValidateNested
} from 'class-validator';
import { EncryptedKeyMaterialDto } from './create-did.dto';

export const DID_X509_POLICY_TYPES = ['subject', 'san', 'eku', 'fulcio-issuer'] as const;
export const DID_X509_SAN_TYPES = ['dns', 'email', 'uri'] as const;

// A PEM bundle or a long chain of 4096-bit RSA certificates stays well below this
const MAX_CERTIFICATE_LENGTH = 100_000;
const MAX_CHAIN_LENGTH = 10;
const MAX_PRIVATE_KEY_LENGTH = 20_000;

export class DidX509PolicyDto {
  @ApiProperty({ enum: DID_X509_POLICY_TYPES, example: 'subject' })
  @IsIn(DID_X509_POLICY_TYPES, { message: `type must be one of ${DID_X509_POLICY_TYPES.join(', ')}` })
  type: (typeof DID_X509_POLICY_TYPES)[number];

  @ApiPropertyOptional({
    description: 'Only for `subject`: the subject attributes of the leaf certificate the DID is restricted to',
    example: { CN: 'example.com', O: 'Example Org' }
  })
  @ValidateIf((policy: DidX509PolicyDto) => 'subject' === policy.type)
  @IsObject({ message: 'fields is required for the subject policy' })
  fields?: Record<string, string>;

  @ApiPropertyOptional({
    enum: DID_X509_SAN_TYPES,
    description: 'Only for `san`: type of the subject alternative name'
  })
  @ValidateIf((policy: DidX509PolicyDto) => 'san' === policy.type)
  @IsIn(DID_X509_SAN_TYPES, { message: `sanType must be one of ${DID_X509_SAN_TYPES.join(', ')}` })
  sanType?: (typeof DID_X509_SAN_TYPES)[number];

  @ApiPropertyOptional({
    description: 'For `san` the name, for `eku` the OID, for `fulcio-issuer` the issuer',
    example: 'example.com'
  })
  @ValidateIf((policy: DidX509PolicyDto) => 'subject' !== policy.type)
  @IsString({ message: 'value must be a string' })
  @IsNotEmpty({ message: 'value is required for the san, eku and fulcio-issuer policies' })
  value?: string;
}

export class ImportDidX509Dto {
  @ApiProperty({
    description:
      'Certificate chain, leaf first and root CA last. Every entry is a PEM certificate, a PEM bundle or a base64 DER certificate',
    example: ['-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----']
  })
  @IsArray({ message: 'certificateChain must be an array' })
  @ArrayMinSize(1, { message: 'certificateChain must contain at least one certificate' })
  @ArrayMaxSize(MAX_CHAIN_LENGTH, { message: `certificateChain must contain at most ${MAX_CHAIN_LENGTH} entries` })
  @IsString({ each: true, message: 'every certificateChain entry must be a string' })
  @IsNotEmpty({ each: true, message: 'certificateChain entries must not be empty' })
  @MaxLength(MAX_CERTIFICATE_LENGTH, { each: true, message: 'a certificateChain entry is too long' })
  certificateChain: string[];

  /**
   * @deprecated Legacy plaintext import. Hidden from the OpenAPI document and rejected unless
   * `ALLOW_PLAINTEXT_KEY_IMPORT=true`. Use `encryptedKey`.
   */
  @ApiHideProperty()
  @ValidateIf((dto: ImportDidX509Dto) => !dto.encryptedKey)
  @IsNotEmpty({ message: 'privateKey or encryptedKey is required' })
  @IsString({ message: 'privateKey must be a string' })
  @MaxLength(MAX_PRIVATE_KEY_LENGTH, { message: 'privateKey is too long' })
  privateKey?: string;

  /** @deprecated Legacy plaintext import, see `privateKey`. */
  @ApiHideProperty()
  @IsOptional()
  @IsString({ message: 'passphrase must be a string' })
  @MaxLength(1000, { message: 'passphrase is too long' })
  passphrase?: string;

  @ApiPropertyOptional({
    type: EncryptedKeyMaterialDto,
    description: 'Leaf private key encrypted to a single-use import session (method `x509`)'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EncryptedKeyMaterialDto)
  encryptedKey?: EncryptedKeyMaterialDto;

  @ApiPropertyOptional({
    type: [DidX509PolicyDto],
    description: 'Policies of the DID. The agent defaults to the common name of the leaf certificate when omitted'
  })
  @IsOptional()
  @IsArray({ message: 'policies must be an array' })
  @ValidateNested({ each: true })
  @Type(() => DidX509PolicyDto)
  policies?: DidX509PolicyDto[];

  @ApiPropertyOptional({
    description: 'Import an existing did:x509 instead of deriving one from the chain, it is validated against the chain'
  })
  @IsOptional()
  @IsString({ message: 'did must be a string' })
  did?: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean({ message: 'isPrimaryDid must be true or false.' })
  isPrimaryDid: boolean = false;
}
