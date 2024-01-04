import { IsArray, IsNotEmpty, IsOptional, IsString, IsEmail, ArrayMaxSize, ValidateNested, MaxLength, ArrayNotEmpty, IsDefined } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { toNumber, trim } from '@credebl/common/cast.helper';

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
}

class CredentialOffer {
    @ApiProperty({ example: [{ 'value': 'string', 'name': 'string' }] })
    @IsNotEmpty({ message: 'Attribute name is required' })
    @IsArray({ message: 'Attributes should be an array' })
    @ValidateNested({ each: true })
    @IsOptional()
    @Type(() => Attribute)
    attributes: Attribute[];

    @ApiProperty({ example: 'testmail@mailinator.com' })
    @IsOptional()
    @IsEmail({}, { message: 'Please provide a valid email' })
    @IsNotEmpty({ message: 'Email is required' })
    @IsString({ message: 'Email should be a string' })
    @MaxLength(256, { message: 'Email must be at most 256 character' })
    @Transform(({ value }) => trim(value))
    emailId: string;
}

export class IssueCredentialDto {
    @ApiProperty({ example: [{ 'value': 'string', 'name': 'string' }] })
    @IsArray({ message: 'Attributes should be an array' })
    @ArrayNotEmpty({message: 'Attributes are required'})
    @ValidateNested({ each: true })
    @Type(() => Attribute)
    attributes: Attribute[];

    @ApiProperty({ example: 'string' })
    @IsNotEmpty({ message: 'credentialDefinitionId is required' })
    @IsString({ message: 'credentialDefinitionId should be a string' })
    credentialDefinitionId: string;

    @ApiProperty({ example: 'string' })
    @IsOptional()
    @IsString({ message: 'Comment should be a string' })
    comment?: string;

    @ApiProperty({ example: 'string' })
    @IsNotEmpty({ message: 'connectionId is required' })
    @IsString({ message: 'connectionId should be string' })
    connectionId: string;

    @IsOptional()
    @IsString({ message: 'protocol-version should be a string' })
    protocolVersion?: string;

    // Added orgId from params to create offer
    orgId: string;
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

export class OutOfBandCredentialDto {

    @ApiProperty({ example: [{ 'emailId': 'abc@example.com', 'attributes': [{ 'value': 'string', 'name': 'string' }] }] })
    @IsNotEmpty({ message: 'Please provide valid attributes' })
    @IsArray({ message: 'attributes should be array'})
    @ArrayMaxSize(Number(process.env.OOB_BATCH_SIZE), { message: `Limit reached (${process.env.OOB_BATCH_SIZE} credentials max). Easily handle larger batches via seamless CSV file uploads`})
    @IsOptional()
    credentialOffer: CredentialOffer[];

    @ApiProperty({ example: 'awqx@getnada.com' })
    @IsEmail()
    @IsNotEmpty({ message: 'Please provide valid email' })
    @IsString({ message: 'email should be string' })
    @Transform(({ value }) => value.trim().toLowerCase())
    @IsOptional()
    emailId: string;

    @ApiProperty({ example: [{ 'value': 'string', 'name': 'string' }] })
    @IsNotEmpty({ message: 'Please provide valid attributes' })
    @IsArray({ message: 'attributes should be array' })
    @ValidateNested({ each: true })
    @Type(() => Attribute)
    @IsOptional()
    attributes: Attribute[];

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

    @ApiProperty({ example: 'v1' })
    @IsOptional()
    @IsNotEmpty({ message: 'Please provide valid protocol version' })
    @IsString({ message: 'protocol version should be string' })
    protocolVersion?: string;

    orgId: string;
}


export class PreviewFileDetails {
    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => String)
    search = '';

    @ApiProperty({ required: false, default: 10 })
    @IsOptional()
    @Type(() => Number)
    @Transform(({ value }) => toNumber(value))
    pageSize = 10;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => String)
    sortValue = '';

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => String)
    sortBy = '';

    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @Transform(({ value }) => toNumber(value))
    pageNumber = 1;
}

export class FileParameter {
    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @Transform(({ value }) => toNumber(value))
    pageNumber = 1;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => String)
    search = '';

    @ApiProperty({ required: false, default: 10 })
    @IsOptional()
    @Type(() => Number)
    @Transform(({ value }) => toNumber(value))
    pageSize = 10;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => String)
    sortBy = '';

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => String)
    sortValue = '';

}

export class ClientDetails {
    @ApiProperty({ required: false, example: '68y647ayAv79879' })
    @IsOptional()
    @Type(() => String)
    clientId = '';

    userId?: string;

}