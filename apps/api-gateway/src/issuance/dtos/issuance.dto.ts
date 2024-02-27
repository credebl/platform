
import { IsArray, IsNotEmpty, IsOptional, IsString, IsEmail, ArrayMaxSize, ValidateNested, ArrayMinSize, IsBoolean, IsDefined, MaxLength, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';
import { SortValue } from '../../enum';
import { SortFields } from 'apps/connection/src/enum/connection.enum';
import { AutoAccept } from '@credebl/enum/enum';
import { IssueCredentialType } from '../interfaces';


class Attribute {
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
    @IsNotEmpty({ message: 'isRequired property is required' })
    isRequired?: boolean = false;

}

class CredentialsIssuanceDto {
    @ApiProperty({ example: 'string' })
    @IsNotEmpty({ message: 'Please provide valid credential definition id' })
    @IsString({ message: 'credential definition id should be string' })
    @Transform(({ value }) => value.trim())
    credentialDefinitionId: string;

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
  @Type(() => Attribute)
  attributes: Attribute[];
}

class CredentialSubject {
 @ApiProperty()
 @IsNotEmpty({ message: 'id is required' })  
 @Type(() => String) 
 id:string;
}
class Credential {
    @ApiProperty()
    @IsNotEmpty({ message: 'context  is required' })
    '@context':[];

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
    @IsString({ message: 'issuer  should be string' })
    @IsNotEmpty({ message: 'issuer is required' })
    @Type(() => String)
    issuer:string;

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
    @ValidateNested({ each: true })
    @Type(() => CredentialSubject)
    credentialSubject:CredentialSubject;
    [key: string]: unknown;
   
  }
  class Options {
    @ApiProperty({ required: true })
    @IsNotEmpty({ message: 'Proof type is required' })
    @Type(() => String)
    proofType:string;

    @ApiProperty({ required: true })
    @IsNotEmpty({ message: ' Proof purpose is required' })
    @Type(() => String)
    proofPurpose: string;
  }
class CredentialOffer {
    @ApiProperty({ example: [{ 'value': 'string', 'name': 'string' }] })
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
    credential?:Credential;

    @ApiProperty()
    @IsOptional()
    @IsNotEmpty({ message: 'Please provide valid options' })
    @IsObject({ message: 'options should be an object' })
    @ValidateNested({ each: true })
    @Type(() => Options)
    options?:Options;

}

export class IssueCredentialDto extends OOBIssueCredentialDto {
    @ApiProperty({ example: 'string' })
    @IsNotEmpty({ message: 'connectionId is required' })
    @IsString({ message: 'connectionId should be string' })
    @Transform(({ value }) => trim(value))
    connectionId: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({ message: 'auto accept proof must be in string' })
    @IsNotEmpty({ message: 'please provide valid auto accept proof' })
    @IsEnum(AutoAccept, {
        message: `Invalid auto accept credential. It should be one of: ${Object.values(AutoAccept).join(', ')}`
    })
    autoAcceptCredential?: string;
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
    @ApiProperty({ example: [
      {
        'emailId': 'xyz@example.com',
        'credential': {
          '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://www.w3.org/2018/credentials/examples/v1'
          ],
          'type': [
            'VerifiableCredential',
            'UniversityDegreeCredential'
          ],
          'issuer': {
            'id': 'did:key:z6MkivTqhrvieQufnHBNHmejocwooSws2zPvYqyAA6T2qeZQ'
          },
          'issuanceDate': '2019-10-12T07:20:50.52Z',
          'credentialSubject': {
            'degree': {
              'type': 'BachelorDegree',
              'name': 'Bachelor of Science and Arts'
            }
          }
        },
        'options': {
          'proofType': 'Ed25519Signature2018',
          'proofPurpose': 'assertionMethod'
        }
      }
    ]
    
 
      })
    @IsNotEmpty({ message: 'Please provide valid attributes' })
    @IsArray({ message: 'attributes should be array' })
    @ArrayMaxSize(Number(process.env.OOB_BATCH_SIZE), { message: `Limit reached (${process.env.OOB_BATCH_SIZE} credentials max). Easily handle larger batches via seamless CSV file uploads` })
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
    // @IsEnum({ message: 'Credential type should be enum' })
    @Transform(({ value }) => trim(value).toLocaleLowerCase())
    @IsOptional()
    credentialType:IssueCredentialType;

    imageUrl?: string;
    
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