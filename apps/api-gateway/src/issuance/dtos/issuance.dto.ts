/* eslint-disable @typescript-eslint/array-type */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDefined,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested
} from 'class-validator';
import { IsCredentialJsonLdContext, SingleOrArray } from '../utils/helper';
import {
  IssueCredentialType,
  JsonLdCredentialDetailCredentialStatusOptions,
  JsonLdCredentialDetailOptionsOptions,
  JsonObject
} from '../interfaces';
import { Transform, Type } from 'class-transformer';

import { AutoAccept, SchemaType, SortValue } from '@credebl/enum/enum';
import { SortFields } from 'apps/connection/src/enum/connection.enum';
import { trim } from '@credebl/common/cast.helper';

class Issuer {
  @ApiProperty()
  @IsNotEmpty({ message: 'id is required' })
  @Type(() => String)
  id: string | { id?: string };
}

class PrettyVc {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'Certificate must be in string format.' })
  certificate: string;

  @ApiPropertyOptional({ example: 'a4' })
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'Size must be in string format.' })
  size: string;

  @ApiPropertyOptional({ example: 'landscape' })
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'orientation must be in string format.' })
  orientation: string;
}
export class Credential {
  @ApiProperty()
  @IsNotEmpty({ message: 'context  is required' })
  @IsCredentialJsonLdContext()
  '@context': Array<string | JsonObject>;

  @ApiProperty()
  @IsNotEmpty({ message: 'type is required' })
  type: string[];

  @ApiProperty()
  @IsString({ message: 'id should be string' })
  @IsNotEmpty({ message: 'id  is required' })
  @Type(() => String)
  @IsOptional()
  id?: string;

  @ApiProperty()
  @ValidateNested({ each: true })
  @Type(() => Issuer)
  issuer: Issuer;

  @ApiProperty()
  @IsString({ message: 'issuance date should be string' })
  @IsNotEmpty({ message: 'issuance date is required' })
  @Type(() => String)
  issuanceDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => PrettyVc)
  prettyVc?: PrettyVc;

  @ApiProperty()
  @IsString({ message: 'expiration date should be string' })
  @IsNotEmpty({ message: 'expiration date  is required' })
  @Type(() => String)
  @IsOptional()
  expirationDate?: string;

  @ApiProperty()
  @IsNotEmpty({ message: ' credential subject required' })
  credentialSubject: SingleOrArray<JsonObject>;
  [key: string]: unknown;
}

export class JsonLdCredentialDetailCredentialStatus {
  public constructor(options: JsonLdCredentialDetailCredentialStatusOptions) {
    if (options) {
      this.type = options.type;
    }
  }
  @IsString()
  public type!: string;
}
export class JsonLdCredentialDetailOptions {
  public constructor(options: JsonLdCredentialDetailOptionsOptions) {
    if (options) {
      this.proofPurpose = options.proofPurpose;
      this.created = options.created;
      this.domain = options.domain;
      this.challenge = options.challenge;
      this.credentialStatus = options.credentialStatus;
      this.proofType = options.proofType;
    }
  }

  @IsString()
  @IsNotEmpty({ message: 'proof purpose is required' })
  public proofPurpose!: string;

  @IsString()
  @IsOptional()
  public created?: string;

  @IsString()
  @IsOptional()
  public domain?: string;

  @IsString()
  @IsOptional()
  public challenge?: string;

  @IsString()
  @IsNotEmpty({ message: 'proof type is required' })
  public proofType!: string;

  @IsOptional()
  @IsObject()
  public credentialStatus?: JsonLdCredentialDetailCredentialStatus;
}
export class Attribute {
  @ApiProperty()
  @IsString({ message: 'Attribute name should be string' })
  @IsNotEmpty({ message: 'Attribute name is required' })
  @Transform(({ value }) => trim(value))
  @Type(() => String)
  name: string;

  @ApiProperty()
  @IsDefined()
  @Transform(({ value }) => trim(value))
  value: string;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean = false;
}
export class CredentialsIssuanceDto {
  @ApiProperty({ example: 'string' })
  @IsNotEmpty({ message: 'Credential definition Id is required' })
  @IsString({ message: 'Credential definition id should be string' })
  @Transform(({ value }) => value.trim())
  @IsOptional()
  credentialDefinitionId?: string;

  @ApiProperty({ example: 'string' })
  @IsNotEmpty({ message: 'Please provide valid comment' })
  @IsString({ message: 'comment should be string' })
  @IsOptional()
  comment: string;

  @ApiPropertyOptional({ example: 'v1' })
  @IsOptional()
  @IsNotEmpty({ message: 'Please provide valid protocol version' })
  @IsString({ message: 'protocol version should be string' })
  protocolVersion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty({ message: 'Please provide valid goal code' })
  @IsString({ message: 'goal code should be string' })
  goalCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty({ message: 'Please provide valid parent thread id' })
  @IsString({ message: 'parent thread id should be string' })
  parentThreadId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty({ message: 'Please provide valid willConfirm' })
  @IsBoolean({ message: 'willConfirm should be boolean' })
  willConfirm?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty({ message: 'Please provide valid label' })
  @IsString({ message: 'label should be string' })
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty({ message: 'please provide valid imageUrl' })
  @IsString({ message: 'imageUrl must be a string' })
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'auto accept proof must be in string' })
  @IsNotEmpty({ message: 'please provide valid auto accept proof' })
  @IsEnum(AutoAccept, {
    message: `Invalid auto accept credential. It should be one of: ${Object.values(AutoAccept).join(', ')}`
  })
  autoAcceptCredential?: string;

  @ApiProperty({ example: 'jsonld' })
  @IsNotEmpty({ message: 'Please provide credential type ' })
  @Transform(({ value }) => trim(value).toLocaleLowerCase())
  @IsOptional()
  credentialType: IssueCredentialType;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsNotEmpty({ message: 'please provide valid value for reuseConnection' })
  @IsBoolean({ message: 'reuseConnection must be a boolean' })
  reuseConnection?: boolean;

  orgId: string;
}

export class OOBIssueCredentialDto extends CredentialsIssuanceDto {
  @ApiProperty({
    example: [
      {
        value: 'string',
        name: 'string'
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @IsOptional()
  @IsNotEmpty({ message: 'Please provide valid attributes' })
  @Type(() => Attribute)
  attributes?: Attribute[];

  @ApiProperty({
    example: false
  })
  @IsOptional()
  @IsNotEmpty()
  @IsBoolean({ message: 'isShortenUrl must be boolean' })
  isShortenUrl?: boolean;

  @ApiProperty()
  @IsNotEmpty({ message: 'Please provide valid credential' })
  @IsObject({ message: 'credential should be an object' })
  @Type(() => Credential)
  @IsOptional()
  @ValidateNested({ each: true })
  credential?: Credential;

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty({ message: 'Please provide valid options' })
  @IsObject({ message: 'options should be an object' })
  @ValidateNested({ each: true })
  @Type(() => JsonLdCredentialDetailOptions)
  options?: JsonLdCredentialDetailOptions;
}

class CredentialOffer {
  @ApiProperty({ example: [{ value: 'string', name: 'string' }] })
  @IsNotEmpty({ message: 'Attribute name is required' })
  @IsArray({ message: 'Attributes should be an array' })
  @ValidateNested({ each: true })
  @Type(() => Attribute)
  @IsOptional()
  attributes?: Attribute[];

  @ApiProperty({ example: 'testmail@xyz.com' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsString({ message: 'Email should be a string' })
  @MaxLength(256, { message: 'Email must be at most 256 character' })
  @Transform(({ value }) => trim(value))
  @Type(() => String)
  emailId: string;

  @IsNotEmpty({ message: 'Please provide valid credential' })
  @IsObject({ message: 'credential should be an object' })
  @Type(() => Credential)
  @IsOptional()
  @ValidateNested({ each: true })
  credential?: Credential;

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty({ message: 'Please provide valid options' })
  @IsObject({ message: 'options should be an object' })
  @ValidateNested({ each: true })
  @Type(() => JsonLdCredentialDetailOptions)
  options?: JsonLdCredentialDetailOptions;
}

export class IssuanceDto {
  @ApiProperty()
  @IsOptional()
  _tags?: object;

  @ApiProperty()
  @IsOptional()
  metadata?: object;

  @ApiProperty()
  @IsOptional()
  credentials: object[];

  @ApiProperty()
  @IsOptional()
  id: string;

  @ApiProperty()
  @IsOptional()
  createdAt: string;

  @ApiProperty()
  @IsOptional()
  state: string;

  @ApiProperty()
  @IsOptional()
  connectionId: string;

  @ApiProperty()
  @IsOptional()
  protocolVersion: string;

  @ApiProperty()
  @IsOptional()
  threadId: string;

  @ApiProperty()
  @IsOptional()
  schemaId: string;

  @ApiProperty()
  @IsOptional()
  credDefId: string;

  @ApiProperty()
  @IsOptional()
  credentialAttributes: CredentialAttributes[];

  @ApiProperty()
  @IsOptional()
  autoAcceptCredential: string;

  @ApiProperty()
  @IsOptional()
  contextCorrelationId: string;

  @ApiPropertyOptional()
  @IsOptional()
  type: string;

  @ApiProperty()
  @IsOptional()
  outOfBandId: string | null;

  @ApiProperty()
  @IsOptional()
  credentialData: object;
}

export class CredentialAttributes {
  @ApiProperty()
  @IsOptional()
  'mime-type'?: string;

  @ApiProperty()
  @IsOptional()
  name?: string;

  @ApiProperty()
  @IsOptional()
  value: string;
}

export class OOBCredentialDtoWithEmail {
  @ApiProperty({
    example: [
      {
        emailId: 'xyz@example.com',
        credential: {
          '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2018/credentials/examples/v1'],
          type: ['VerifiableCredential', 'UniversityDegreeCredential'],
          issuer: {
            id: 'did:key:z6Mkn72LVp3mq1fWSefkSMh5V7qrmGfCV4KH3K6SoTM21ouM'
          },
          issuanceDate: '2019-10-12T07:20:50.52Z',
          credentialSubject: {
            id: 'did:key:z6Mkn72LVp3mq1fWSefkSMh5V7qrmGfCV4KH3K6SoTM21ouM',
            degree: {
              type: 'BachelorDegree',
              name: 'Bachelor of Science and Arts'
            }
          }
        },
        options: {
          proofType: 'Ed25519Signature2018',
          proofPurpose: 'assertionMethod'
        }
      }
    ]
  })
  @IsNotEmpty({ message: 'Please provide valid attributes' })
  @IsArray({ message: 'attributes should be array' })
  @ArrayMaxSize(Number(process.env.OOB_BATCH_SIZE), {
    message: `Limit reached (${process.env.OOB_BATCH_SIZE} credentials max). Easily handle larger batches via seamless CSV file uploads`
  })
  @ValidateNested({ each: true })
  @Type(() => CredentialOffer)
  credentialOffer: CredentialOffer[];

  @ApiProperty({ example: 'string' })
  @IsNotEmpty({ message: 'Please provide valid credential definition id' })
  @IsString({ message: 'credential definition id should be string' })
  @IsOptional()
  @Transform(({ value }) => value.trim())
  credentialDefinitionId?: string;

  @ApiProperty({ example: 'string' })
  @IsOptional()
  @IsNotEmpty({ message: 'Please provide valid comment' })
  @IsString({ message: 'comment should be string' })
  comment?: string;

  @ApiProperty({ example: 'v1' })
  @IsOptional()
  @IsNotEmpty({ message: 'Please provide valid protocol version' })
  @IsString({ message: 'protocol version should be string' })
  protocolVersion?: string;

  @ApiProperty({ example: 'jsonld' })
  @IsNotEmpty({ message: 'Please provide credential type ' })
  @Transform(({ value }) => trim(value).toLocaleLowerCase())
  @IsOptional()
  credentialType: IssueCredentialType;

  imageUrl?: string;

  orgId: string;
}

export class PreviewFileDetails {
  @ApiProperty({ required: false, example: '1' })
  @IsOptional()
  pageNumber: number = 1;

  @ApiProperty({ required: false, example: '10' })
  @IsOptional()
  pageSize: number = 10;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @Type(() => String)
  searchByText: string = '';
}

export class FileParameter {
  @ApiProperty({ required: false, example: '10' })
  @IsOptional()
  pageSize: number = 10;

  @ApiProperty({ required: false, example: '1' })
  @IsOptional()
  pageNumber: number = 1;

  @ApiProperty({
    required: false
  })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsEnum(SortFields)
  sortField: string = SortFields.CREATED_DATE_TIME;

  @ApiProperty({
    enum: [SortValue.DESC, SortValue.ASC],
    required: false
  })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsEnum(SortValue)
  sortBy: string = SortValue.DESC;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @Type(() => String)
  searchByText: string = '';
}

export class ClientDetails {
  @ApiProperty({ required: false, example: '68y647ayAv79879' })
  @IsOptional()
  @Type(() => String)
  clientId = '';

  @ApiProperty({ required: false, example: 'issue-data.csv' })
  @IsOptional()
  @Type(() => String)
  fileName = '';

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Boolean)
  isSelectiveIssuance?: boolean = false;

  userId?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsUrl(
    {
      // eslint-disable-next-line camelcase
      require_protocol: true,
      // eslint-disable-next-line camelcase
      require_tld: true
    },
    { message: 'brandLogoUrl should be a valid URL' }
  )
  organizationLogoUrl?: string;

  @ApiPropertyOptional({ example: 'MyPlatform' })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsString({ message: 'platformName should be string' })
  platformName?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsString({ message: 'Certificate should be string' })
  certificate?: string;

  @ApiPropertyOptional({ example: 'a4' })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsString({ message: 'Size should be string' })
  size?: string;

  @ApiPropertyOptional({ example: 'landscape' })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsString({ message: 'Orientation should be string' })
  orientation?: string;
}

export class TemplateDetails {
  @ApiProperty({ required: true, example: 'R2Wh9dJmnvkPnzKaiiBptR:2:BulkCredentials:0.1' })
  @IsOptional()
  @IsString({ message: 'templateId should be string' })
  @IsNotEmpty({ message: 'Template Id is required' })
  @Transform(({ value }) => trim(value))
  templateId: string = '';

  @ApiProperty({ enum: SchemaType, required: true })
  @IsEnum(SchemaType, { message: 'Schema type should be a valid' })
  schemaType: SchemaType;
}

export class FileUploadDetails extends TemplateDetails {
  @ApiProperty({ required: false, example: 'CSV file' })
  @IsOptional()
  @IsString({ message: 'fileName should be string' })
  fileName: string;
}

export class CredentialQuery {
  @ApiPropertyOptional({ required: false, example: 'R2Wh9dJmnvkPnzKaiiBptR:2:BulkCredentials:0.1' })
  @IsOptional()
  @IsString({ message: 'Cred def Id should be string' })
  @IsNotEmpty({ message: 'Cred def Id is required' })
  @Transform(({ value }) => trim(value))
  credDefId?: string;
}

export class TemplateQuery {
  @ApiProperty({ required: true, example: 'R2Wh9dJmnvkPnzKaiiBptR:2:BulkCredentials:0.1' })
  @IsString({ message: 'templateId should be string' })
  @IsNotEmpty({ message: 'Template Id is required' })
  @Transform(({ value }) => trim(value))
  templateId: string;
}
export class FileQuery {
  @ApiProperty({ required: true })
  @IsString({ message: 'fileId should be string' })
  @IsNotEmpty({ message: 'fileId Id is required' })
  @Transform(({ value }) => trim(value))
  fileId: string;
}

export class RequestIdQuery {
  @ApiPropertyOptional({ required: false })
  @IsOptional()
  @IsString({ message: 'requestId should be string' })
  @IsNotEmpty({ message: 'requestId Id is required' })
  @Transform(({ value }) => trim(value))
  requestId: string;
}
