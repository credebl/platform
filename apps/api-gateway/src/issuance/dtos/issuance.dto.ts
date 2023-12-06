import { IsArray, IsNotEmpty, IsOptional, IsString, IsEmail, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { toNumber } from '@credebl/common/cast.helper';

interface CredentialOffer {
    emailId: string;
    attributes: Attribute[];
}

interface Attribute {
    name: string;
    value: string;
}

export class IssueCredentialDto {

    @ApiProperty({ example: [{ 'value': 'string', 'name': 'string' }] })
    @IsNotEmpty({ message: 'Please provide valid attributes' })
    @IsArray({ message: 'attributes should be array' })
    attributes: Attribute[];

    @ApiProperty({ example: 'string' })
    @IsNotEmpty({ message: 'Please provide valid credentialDefinitionId' })
    @IsString({ message: 'credentialDefinitionId should be string' })
    credentialDefinitionId: string;

    @ApiProperty({ example: 'string' })
    @IsNotEmpty({ message: 'Please provide valid comment' })
    @IsString({ message: 'comment should be string' })
    @IsOptional()
    comment: string;

    @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
    @IsNotEmpty({ message: 'Please provide valid connectionId' })
    @IsString({ message: 'connectionId should be string' })
    connectionId: string;

    @IsOptional()
    @IsNotEmpty({ message: 'Please provide valid protocol-version' })
    @IsString({ message: 'protocol-version should be string' })
    protocolVersion?: string;
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

    @ApiProperty({ example: [{ 'emailId': 'abc@example.com', 'attribute': [{ 'value': 'string', 'name': 'string' }] }] })
    @IsNotEmpty({ message: 'Please provide valid attributes' })
    @IsArray({ message: 'attributes should be array'})
    @ArrayMaxSize(Number(process.env.OOB_BATCH_SIZE), { message: `Limit reached (${process.env.OOB_BATCH_SIZE} credentials max). Easily handle larger batches via seamless CSV file uploads`})
    @IsOptional()
    credentialOffer: CredentialOffer[];

    @ApiProperty({ example: 'awqx@getnada.com' })
    @IsEmail()
    @IsNotEmpty({ message: 'Please provide valid email' })
    @IsString({ message: 'email should be string' })
    @IsOptional()
    emailId: string;

    @ApiProperty({ example: [{ 'value': 'string', 'name': 'string' }] })
    @IsNotEmpty({ message: 'Please provide valid attributes' })
    @IsArray({ message: 'attributes should be array' })
    @IsOptional()
    attributes: Attribute[];

    @ApiProperty({ example: 'string' })
    @IsNotEmpty({ message: 'Please provide valid credential definition id' })
    @IsString({ message: 'credential definition id should be string' })
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