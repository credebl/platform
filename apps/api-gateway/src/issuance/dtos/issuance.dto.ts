/* eslint-disable @typescript-eslint/array-type */

import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsDefined, IsEmail, IsEnum, IsMimeType, IsNotEmpty, IsNotEmptyObject, IsObject, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { IsCredentialJsonLdContext, SingleOrArray } from '../utils/helper';
import { IssueCredentialType, JsonLdCredentialDetailCredentialStatusOptions, JsonLdCredentialDetailOptionsOptions, JsonObject } from '../interfaces';
import { Transform, Type } from 'class-transformer';

import { AutoAccept, ProtocolVersion, SchemaType } from '@credebl/enum/enum';
import { SortFields } from 'apps/connection/src/enum/connection.enum';
import { SortValue } from '../../enum';
import { trim } from '@credebl/common/cast.helper';
import { BadRequestException } from '@nestjs/common';

class Issuer {
  @ApiProperty()
  @IsNotEmpty({ message: 'id is required' })  
  @Type(() => String) 
  id:string | { id?: string };
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
    id?:string;

    
    @ApiProperty()
    @ValidateNested({ each: true })
    @Type(() => Issuer)
    issuer:Issuer;

    @ApiProperty()
    @IsString({ message: 'issuance date should be string' })
    @IsNotEmpty({ message: 'issuance date is required' })
    @Type(() => String)
    issuanceDate:string;
   
    @ApiProperty()
    @IsString({ message: 'expiration date should be string' })
    @IsNotEmpty({ message: 'expiration date  is required' })
    @Type(() => String)
    @IsOptional()
    expirationDate?:string;

     @ApiProperty()
     @IsNotEmpty({ message: ' credential subject required' })
     credentialSubject: SingleOrArray<JsonObject>;
     [key: string]: unknown
   
  }

  export class JsonLdCredentialDetailCredentialStatus {
    public constructor(options: JsonLdCredentialDetailCredentialStatusOptions) {
      if (options) {
        this.type = options.type;
      }
    }

    @ApiProperty()
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
  
    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'proof purpose is required' })
    public proofPurpose!: string;
  
    @ApiProperty()
    @IsString()
    @IsOptional()
    public created?: string;
  
    @ApiProperty()
    @IsString()
    @IsOptional()
    public domain?: string;
  
    @ApiProperty()
    @IsString()
    @IsOptional()
    public challenge?: string;
  
    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'proof type is required' })
    public proofType!: string;
  
    @ApiProperty({ type: JsonLdCredentialDetailCredentialStatus })
    @IsOptional()
    @IsObject()
    public credentialStatus?: JsonLdCredentialDetailCredentialStatus;
  }


  export interface CredentialPreviewAttributeOptions {
    name: string
    mimeType?: string
    value: string
  }
  
  export class CredentialPreviewAttribute {
    public constructor(options: CredentialPreviewAttributeOptions) {
      if (options) {
        this.name = options.name;
        this.mimeType = options.mimeType;
        this.value = options.value;
      }
    }
  
    @ApiProperty({ example: 'name' })
    @IsNotEmpty({message: 'name cannot be empty'})
    @IsString()
    public name!: string;
  
  
    @ApiProperty({ example: 'text/plain' })
    @IsOptional()
    @IsMimeType()
    public mimeType?: string = 'text/plain';
  
    @ApiProperty({ example: 'Alice' })
    @IsNotEmpty({message: 'value cannot be empty'})
    @IsString()
    public value!: string;
  }

  export interface CredentialPreviewOptions {
  attributes: CredentialPreviewAttributeOptions[]
  }

  
  export class AnoncredsObject {
  
    @ApiProperty({type: [CredentialPreviewAttribute]})
    @ArrayMinSize(1)
    @ValidateNested()
    @Type(() => CredentialPreviewAttribute)
    attributes: CredentialPreviewAttribute[];
  
    @ApiProperty({ example: 'Mdst5jN9uavVM8tq4qgxUm:3:CL:60112:default' })
    @IsNotEmpty({ message: 'Credential definition Id is required' })
    @IsString({ message: 'Credential definition id should be string' })
    @Transform(({ value }) => value.trim())
    credentialDefinitionId: string;
  }
  
  export class AttributesDto {
    @ApiProperty({ example: 'name' })
    @IsNotEmpty({message: 'name cannot be empty'})
    @IsString()
    public name!: string;
  
    @ApiProperty({ example: 'Alice' })
    @IsNotEmpty({message: 'value cannot be empty'})
    @IsString()
    public value!: string;
  }
  
  export class IndyObject {
    @ApiProperty({ type: [AttributesDto]})
    @ArrayMinSize(1)
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => AttributesDto)
    attributes: AttributesDto[];
  
    @ApiProperty({ example: 'Mdst5jN9uavVM8tq4qgxUm:3:CL:60112:default' })
    @IsNotEmpty({ message: 'Credential definition Id is required' })
    @IsString({ message: 'Credential definition id should be string' })
    @Transform(({ value }) => value.trim())
    credentialDefinitionId: string;
  }
  
  export class JsonLdObject {
    @ApiProperty({ type: Credential })
    @IsNotEmpty({ message: 'Please provide valid credential' })
    @ValidateNested()
    @Type(() => Credential)
    credential: Credential;
  
    @ApiProperty({ type: JsonLdCredentialDetailOptions })
    @IsNotEmpty({ message: 'Please provide valid options' })
    @ValidateNested()
    @Type(() => JsonLdCredentialDetailOptions)
    options: JsonLdCredentialDetailOptions;
  }
  
  export class IndyDto {
    @ApiProperty({type: IndyObject})
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => IndyObject)
    indy: IndyObject;
  }
  
  export class AnonCredsDto {
    @ApiProperty({type: AnoncredsObject})
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => AnoncredsObject)
    anoncreds: AnoncredsObject;
  }
  
  export class JsonLdDto {
    @ApiProperty({type: JsonLdObject})
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => JsonLdObject)
    jsonld: JsonLdObject;
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

export class IssuanceFields {
  @ApiPropertyOptional({ example: 'string' })
  @IsNotEmpty({ message: 'Please provide valid comment' })
  @IsString({ message: 'comment should be string' })
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({ enum: ProtocolVersion, example: 'v2' })
  @IsOptional()
  @Transform(({ value }) => trim(value).toLocaleLowerCase())
  @IsNotEmpty({ message: 'Please provide valid protocol version' })
  @IsString({ message: 'protocol version should be string' })
  protocolVersion?: ProtocolVersion = ProtocolVersion.v2;


  @ApiPropertyOptional({enum: AutoAccept})
  @IsOptional()
  @IsString({ message: 'auto accept proof must be in string' })
  @IsNotEmpty({ message: 'please provide valid auto accept proof' })
  @IsEnum(AutoAccept, {
      message: `Invalid auto accept credential. It should be one of: ${Object.values(AutoAccept).join(', ')}`
  })
  autoAcceptCredential: AutoAccept = AutoAccept.ALWAYS;

  @ApiProperty({ enum: IssueCredentialType })
  @IsNotEmpty({ message: 'Please provide credential type ' })
  @Transform(({ value }) => trim(value).toLocaleLowerCase())
  @IsEnum(IssueCredentialType, {
    message: `Invalid auto accept credential. It should be one of: ${Object.values(IssueCredentialType).join(', ')}`
  })
  credentialType:IssueCredentialType = IssueCredentialType.INDY;

  orgId: string;
}
export class CredentialsIssuanceDto extends IssuanceFields {

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

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsNotEmpty({ message: 'please provide valid value for reuseConnection' })
    @IsBoolean({ message: 'reuseConnection must be a boolean' })
    reuseConnection?: boolean;
}

@ApiExtraModels(AnonCredsDto, JsonLdDto, IndyDto)
export class OOBIssueCredentialDto extends CredentialsIssuanceDto {

  @ApiProperty({
    type: Object,
    oneOf: [
      { $ref: getSchemaPath(AnonCredsDto) },
      { $ref: getSchemaPath(JsonLdDto) },
      { $ref: getSchemaPath(IndyDto) }
    ]
  })
  @ValidateNested()
  @Type(({ object }) => {
    const {credentialType} = object;
    switch (credentialType) {
      case IssueCredentialType.INDY:
        return IndyDto;
      case IssueCredentialType.ANONCREDS:
        return AnonCredsDto;
      case IssueCredentialType.JSONLD:
        return JsonLdDto;
      default:
        throw new BadRequestException('Invalid credentialType');
    }
  })
  @IsNotEmpty()
  credentialFormats: AnonCredsDto | JsonLdDto | IndyDto;

  @ApiProperty({
    example: false
  })
  @IsOptional()
  @IsNotEmpty()
  @IsBoolean({message: 'isShortenUrl must be boolean'})
  isShortenUrl?: boolean;

}

@ApiExtraModels(AnonCredsDto, JsonLdDto, IndyDto)
export class CredentialOffer {

    @ApiProperty({
      type: Object,
      oneOf: [
        { $ref: getSchemaPath(AnonCredsDto) },
        { $ref: getSchemaPath(JsonLdDto) },
        { $ref: getSchemaPath(IndyDto) }
      ]
    })
    @IsNotEmptyObject()
    credentialFormats: AnonCredsDto | JsonLdDto | IndyDto;

    @ApiProperty({ example: 'testmail@xyz.com' })
    @IsEmail({}, { message: 'Please provide a valid email' })
    @IsNotEmpty({ message: 'Email is required' })
    @IsString({ message: 'Email should be a string' })
    @MaxLength(256, { message: 'Email must be at most 256 character' })
    @Transform(({ value }) => trim(value))
    @Type(() => String)
    emailId: string;

    
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

@ApiExtraModels(AnonCredsDto, JsonLdDto, IndyDto)
export class OOBCredentialDtoWithEmail extends CredentialsIssuanceDto {
    @ApiProperty({type: [CredentialOffer]})
    @IsNotEmpty({ message: 'Please provide valid attributes' })
    @IsArray({ message: 'attributes should be array' })
    @ArrayMaxSize(Number(process.env.OOB_BATCH_SIZE), { message: `Limit reached (${process.env.OOB_BATCH_SIZE} credentials max). Easily handle larger batches via seamless CSV file uploads` })
    @ValidateNested({ each: true })
    @Type(() => CredentialOffer)
    credentialOffer: CredentialOffer[];

    @ApiProperty({ example: 'string' })
    @IsOptional()
    @IsNotEmpty({ message: 'Please provide valid comment' })
    @IsString({ message: 'comment should be string' })
    comment?: string;

    @ApiProperty({ enum: ProtocolVersion, example: 'v2' })
    @IsOptional()
    @IsNotEmpty({ message: 'Please provide valid protocol version' })
    @IsString({ message: 'protocol version should be string' })
    protocolVersion?: ProtocolVersion;
    
    orgId: string;
}


export class PreviewFileDetails {
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

    @ApiProperty({ required: false, example: '10' })
    @IsOptional()
    pageSize: number = 10;

    @ApiProperty({ required: false, example: '1' })
    @IsOptional()
    pageNumber: number = 1;

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
