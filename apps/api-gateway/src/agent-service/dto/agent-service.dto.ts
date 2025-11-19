import { trim } from '@credebl/common/cast.helper';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  Validate,
  ValidateIf,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator';
import { CreateDidDto } from './create-did.dto';
import { RewriteValidationOptions } from '@credebl/common/custom-overrideable-validation-pipe';
import { BadRequestException } from '@nestjs/common';

const regex = /^[a-zA-Z0-9 ]*$/;
export class AgentSpinupDto extends CreateDidDto {
  @ApiProperty()
  @MaxLength(25, { message: 'Maximum length for wallet must be 25 characters.' })
  @IsString({ message: 'label must be in string format.' })
  @Transform(({ value }) => trim(value))
  @MinLength(2, { message: 'Minimum length for wallet name must be 2 characters.' })
  @Matches(regex, { message: 'Wallet name must not contain special characters.' })
  @Matches(/^\S*$/, {
    message: 'Spaces are not allowed in walletName'
  })
  walletName: string;

  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsString({ message: 'walletPassword must be in string format.' })
  @IsNotEmpty({ message: 'Password is required.' })
  walletPassword?: string;

  @ApiPropertyOptional({ example: 'XzFjo1RTZ2h9UVFCnPUyaQ' })
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'did must be in string format.' })
  did?: string;

  @ApiPropertyOptional({ example: 'ojIckSD2jqNzOqIrAGzL' })
  @IsOptional()
  clientSocketId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  tenant?: boolean;
  
  orgId: string;
}

class W3cCredentialSubjectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  [key: string]: unknown;
}

export class W3cCredentialDto {
  @ApiProperty({ type: [String], example: ['https://www.w3.org/2018/credentials/v1'] })
  @IsArray()
  '@context': string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ type: [String], example: ['VerifiableCredential'] })
  @IsArray()
  type: string[];

  // TODO: Add or W3cIssuerDto
  @ApiProperty({ type: String, example: 'did:key:z6Mkpz1qHuoMamuHj8YXJNBDu2GrLz3LzinA5t4GiYtYKSv8' })
  @IsString()
  issuer: string;

  @ApiProperty()
  @IsISO8601()
  issuanceDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  expirationDate?: string;

  @ApiProperty({ type: W3cCredentialSubjectDto })
  @ValidateNested()
  @Type(() => W3cCredentialSubjectDto)
  credentialSubject: W3cCredentialSubjectDto;

  [key: string]: unknown;
}

export class W3cJsonLdSignCredentialDto {
  @ApiProperty({ type: W3cCredentialDto })
  @ValidateNested()
  @Type(() => W3cCredentialDto)
  credential: W3cCredentialDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  verificationMethod?: string;

  @ApiProperty()
  @IsString()
  proofType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  proofPurpose?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  created?: string;

  [key: string]: unknown;
}

@ValidatorConstraint({ name: 'AtLeastOneKey', async: false })
class AtLeastOneKeyConstraint implements ValidatorConstraintInterface {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validate(_: any, args: ValidationArguments): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = args.object as any;
    return Boolean(obj.publicKeyBase58 || obj.did || obj.method);
  }

  defaultMessage(): string {
    throw new BadRequestException('At least one of publicKeyBase58, did, or method must be provided in SignRawDataDto');
  }
}

export class SignRawDataDto {
  @ApiProperty({ description: 'Data to be signed as a string (e.g., base64, JSON)' })
  @IsString()
  data: string;

  @ApiProperty({ description: 'keyType either ed25519, x25519, k256 or p256' })
  @IsString()
  keyType: string;

  @ApiPropertyOptional({ description: 'Base58-encoded public key' })
  @IsOptional()
  @IsString()
  publicKeyBase58?: string;

  @ApiPropertyOptional({ description: 'DID to derive signing key from' })
  @IsOptional()
  @IsString()
  did?: string;

  @ApiPropertyOptional({ description: 'Verification method ID' })
  @IsOptional()
  @IsString()
  method?: string;

  @Validate(AtLeastOneKeyConstraint)
  private readonly _atLeastOneKeyCheck = true; // dummy property to trigger class-level validation
}

@RewriteValidationOptions({ whitelist: false })
export class SignDataDto {
  @ApiProperty({
    description: 'Type of data being signed. Use \'jsonLd\' for W3C credentials or \'rawData\' for any other JSON.',
    enum: ['jsonLd', 'rawData']
  })
  @IsIn(['jsonLd', 'rawData'])
  dataTypeToSign: 'jsonLd' | 'rawData' = 'rawData';

  @ApiProperty({
    description: 'Store credential boolean if we want to credential after signing it',
    enum: [true, false]
  })
  @ValidateIf((o) => 'jsonLd' === o.dataTypeToSign)
  @IsBoolean()
  storeCredential: boolean = false;

  @ApiProperty({
    type: W3cJsonLdSignCredentialDto
  })
  @ValidateIf((o) => 'jsonLd' === o.dataTypeToSign)
  @ValidateNested()
  @Type(() => W3cJsonLdSignCredentialDto)
  credentialPayload?: W3cJsonLdSignCredentialDto;

  @ApiPropertyOptional({ description: 'Any data object if dataTypeToSign is "rawData"', type: SignRawDataDto })
  @ValidateIf((o) => 'data' === o.dataTypeToSign)
  @Type(() => SignRawDataDto)
  rawPayload?: SignRawDataDto;
}

export class VerifySignatureDto {
  @ApiProperty({
    type: String,
    description: 'Data to verify for given signature',
    example: 'test data'
  })
  data: string;

  @ApiProperty({
    type: String,
    description: 'This is the signature to validate with the given key',
    example: 'p256'
  })
  keyType?: string;
  
  @ApiProperty({
    type: String,
    description: 'Base58 of public key to verify the signature',
    example: 'aSzvTBobJJoaBiwS9aGY76gkxqgNjqEmEvBiRQyBaee'
  })
  publicKeyBase58: string;

  @ApiProperty({
    type: String,
    description: 'Signature to verify',
    example: 'p52JT9PacBjIrv4Zia/RQBgT8OYGTC7dSek66pSIXQRX4ffv06wFBaQ=='
  })
  signature: string;

  @ApiProperty({
    type: String,
    description: 'DID used during signature to verify the provided signature',
    example: 'did:key:z6MkhbXESQ6QqSJZ7g9tzdag7gJ6voBonGnWsEVmvsUBmjfC'
  })
  did?: string;

  @ApiProperty({
    type: String,
    description: 'DID Method',
    example: 'Ed25519'
  })
  method?: string;
}

export interface IVerifySignature {
  data: string
  keyType?: string
  publicKeyBase58: string
  signature: string
  did?: string
  method?: string
}
