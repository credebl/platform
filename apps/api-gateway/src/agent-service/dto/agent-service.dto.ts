import { trim } from '@credebl/common/cast.helper';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
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
import { KeyType } from '@credebl/enum/enum';
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

// class W3cIssuerDto {
//   @ApiProperty()
//   @IsString()
//   id: string;
// }

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

  @ApiProperty({ enum: KeyType, enumName: 'KeyType' })
  @IsEnum(KeyType, { message: 'keyType must be a valid KeyType value' })
  keyType: KeyType;

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
    description: "Type of data being signed. Use 'jsonLd' for W3C credentials or 'rawData' for any other JSON.",
    enum: ['jsonLd', 'rawData']
  })
  @IsIn(['jsonLd', 'rawData'])
  dataTypeToSign: 'jsonLd' | 'rawData';

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
    description: 'This is the signed w3c-jsonLd credential, which we want to verify',
    example: {
      id: 'http://example.com/credential/9290ae08-8959-4723-a26a-921aab97de6e',
      name: 'Teamwork v2',
      type: ['VerifiableCredential', 'OpenBadgeCredential'],
      image: {
        id: 'https://example.com/BadgeDesigns/a99a4121-e04e-477c-a890-15e9af789f73/1c61a4b2-dca4-4684-8f63-221333fd5c86-Teamwork%20v2.png',
        type: 'Image'
      },
      proof: {
        jws: 'eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..PN0gqrfiMhO_2AIT9i3Tv1Qt9Owlh5ZBPnplCrta49-6oyEpHg4aQwjGADe-B2RADb_cvdgVqTJe1G-ds9UYDg',
        type: 'Ed25519Signature2018',
        created: '2025-06-13T13:47:35Z',
        proofPurpose: 'assertionMethod',
        verificationMethod:
          'did:key:z6MkwSMgqptU9M5AiymSSXv3HLhEhXfE6RonJwMSG2dmURdE#z6MkwSMgqptU9M5AiymSSXv3HLhEhXfE6RonJwMSG2dmURdE'
      },
      issuer: {
        id: 'did:key:z6MkwSMgqptU9M5AiymSSXv3HLhEhXfE6RonJwMSG2dmURdE'
      },
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3id.org/security/data-integrity/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json'
      ],
      validFrom: '2025-06-13T13:47:35.201Z',
      awardedDate: '2025-06-12T18:30:00.000Z',
      description:
        'EricTech is a cutting-edge product innovation company specialising in Web 3.0 development with extensive expertise in modern technologies. Our unique approach to product invention involves a comprehensive process, starting from the discovery phase and progressing through planning, research, development, marketing, and launch, all tailored to assist businesses in achieving their goals.',
      issuanceDate: '2025-06-13T13:47:35.201Z',
      expirationDate: '2026-12-30T18:30:00.000Z',
      credentialStatus: {
        id: 'http://example.com/revocation/addfc5a0-258f-4977-a138-f0d9f33d6dc6',
        type: '1EdTechRevocationList'
      },
      credentialSubject: {
        type: ['AchievementSubject'],
        identifier: [
          {
            type: 'IdentityObject',
            hashed: 'FALSE',
            identityHash: 'test@yopmail.com',
            identityType: 'emailAddress'
          }
        ],
        achievement: {
          id: 'ds',
          Tag: ['fghfgh', 'fhfgh'],
          Type: ['Achievement'],
          name: 'sddgh',
          image: {
            id: 'sdsd',
            type: 'sdd'
          },
          version: '2',
          criteria: {
            narrative: 'sdd'
          },
          humanCode: 'sd',
          description: 'sdd',
          fieldOfStudy: 'sdsd',
          specialization: 'fghfg',
          achievementType: 'LearningProgram',
          otherIdentifier: [
            {
              type: 'fhgf',
              identifier: 'fghfgh',
              identifierType: 'fghfgh'
            }
          ]
        }
      }
    }
  })
  credential: unknown;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  verifyCredentialStatus?: boolean;
}
