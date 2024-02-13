import { IsArray, IsNotEmpty, IsOptional, IsString, IsEmail, ArrayMaxSize, ValidateNested, IsDefined, MaxLength, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';
import { SortValue } from '../../enum';
import { SortFields } from 'apps/connection/src/enum/connection.enum';
import { AutoAccept } from '@credebl/enum/enum';

class Attribute {
    @ApiProperty()
    @IsString({ message: 'Attribute name should be string' })
    @IsNotEmpty({ message: 'Attribute name is required' })
    @Type(() => String)
    @Transform(({ value }) => trim(value))
    name: string;

    @ApiProperty()
    @IsDefined()
    @Transform(({ value }) => trim(value))
    value: string;
}

class CredentialOffer {
    @ApiProperty()
    @IsArray({ message: 'Attributes should be an array' })
    @ArrayNotEmpty({ message: 'Attributes are required' })
    @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @Type(() => Attribute)
    attributes: Attribute[];

    @ApiProperty()
    @IsEmail({}, { message: 'Email is invalid' })
    @IsNotEmpty({ message: 'Email is required' })
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

export class OutOfBandCredentialOfferDto {
    @ApiProperty({
        example: [
            {
                'emailId': 'testmail@domain.com',
                'attributes': [
                    {
                        'value': 'string',
                        'name': 'string'
                    }
                ]
            }
        ]
    })
    @ArrayMaxSize(Number(process.env.OOB_BATCH_SIZE), { message: `Limit reached (${process.env.OOB_BATCH_SIZE} credentials max). Easily handle larger batches via seamless CSV file uploads` })
    @IsArray({ message: 'Credential offer details should be array' })
    @ArrayNotEmpty({ message: 'Credential offer details required' })
    @ValidateNested({ each: true })
    @Type(() => CredentialOffer)
    credentialOffer: CredentialOffer[];

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