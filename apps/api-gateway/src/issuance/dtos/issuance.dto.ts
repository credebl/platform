import { IsArray, IsNotEmpty, IsOptional, IsString, IsEmail, ArrayMaxSize, ValidateNested, IsDefined, ArrayNotEmpty, MaxLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';
import { SortValue } from '../../enum';
import { SortFields } from 'apps/connection/src/enum/connection.enum';

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

export class OOBIssueCredentialDto {
    @ApiProperty({ example: [{ 'value': 'string', 'name': 'string' }] })
    @IsArray({ message: 'Attributes should be an array' })
    @ArrayNotEmpty({message: 'Attributes are required'})
    @ValidateNested({ each: true })
    @Type(() => Attribute)
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

    @IsOptional()
    @IsNotEmpty({ message: 'Please provide valid protocol-version' })
    @IsString({ message: 'protocolVersion should be string' })
    protocolVersion?: string;

    orgId: string;
}

class CredentialOffer {
    @ApiProperty({ example: [{ 'value': 'string', 'name': 'string' }] })
    @IsNotEmpty({ message: 'Attribute name is required' })
    @IsArray({ message: 'Attributes should be an array' })
    @ValidateNested({ each: true })
    @Type(() => Attribute)
    attributes: Attribute[];

    @ApiProperty({ example: 'testmail@mailinator.com' })
    @IsEmail({}, { message: 'Please provide a valid email' })
    @IsNotEmpty({ message: 'Email is required' })
    @IsString({ message: 'Email should be a string' })
    @MaxLength(256, { message: 'Email must be at most 256 character' })
    @Transform(({ value }) => trim(value))
    @Type(() => String)
    emailId: string;
}

export class IssueCredentialDto extends OOBIssueCredentialDto {
    @ApiProperty({ example: 'string' })
    @IsNotEmpty({ message: 'connectionId is required' })
    @IsString({ message: 'connectionId should be string' })
    @Transform(({ value }) => trim(value))
    connectionId: string;
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
    @ApiProperty({ example: [{ 'emailId': 'abc@example.com', 'attributes': [{ 'value': 'string', 'name': 'string' }] }] })
    @IsNotEmpty({ message: 'Please provide valid attributes' })
    @IsArray({ message: 'attributes should be array'})
    @ArrayMaxSize(Number(process.env.OOB_BATCH_SIZE), { message: `Limit reached (${process.env.OOB_BATCH_SIZE} credentials max). Easily handle larger batches via seamless CSV file uploads`})
    @ValidateNested({ each: true })
    @Type(() => CredentialOffer)
    credentialOffer: CredentialOffer[];

    @ApiProperty({ example: 'awqx@getnada.com' })
    @IsEmail({}, { message: 'Please provide a valid email' })
    @IsNotEmpty({ message: 'Please provide valid email' })
    @IsString({ message: 'email should be string' })
    @Transform(({ value }) => value.trim().toLowerCase())
    @IsOptional()
    emailId: string;

    @ApiProperty({ example: 'string' })
    @IsNotEmpty({ message: 'Please provide valid credential definition id' })
    @IsString({ message: 'credential definition id should be string' })
    @Transform(({ value }) => value.trim())
    credentialDefinitionId: string;

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

    userId?: string;

}