import { IsArray, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { toLowerCase, trim } from '@credebl/common/cast.helper';

interface attribute {
    name: string;
    value: string;
}

export class IssueCredentialDto {

    @ApiProperty({ example: [{ 'value': 'string', 'name': 'string' }] })
    @IsNotEmpty({ message: 'Please provide valid attributes' })
    @IsArray({ message: 'attributes should be array' })
    attributes: attribute[];

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

    @ApiProperty({ example: 'v1' })
    @IsOptional()
    @IsNotEmpty({ message: 'Please provide valid protocol-version' })
    @IsString({ message: 'protocol-version should be string' })
    protocolVersion?: string;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty({ message: 'please provide orgId' })
    orgId: number;
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
    credentialAttributes: CredentialAttributes[];

    @ApiProperty()
    @IsOptional()
    autoAcceptCredential: string;
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

    @ApiProperty({ example: 'string' })
    @IsNotEmpty({ message: 'Please provide valid emailId' })
    @Transform(({ value }) => trim(value))
    @Transform(({ value }) => toLowerCase(value))
    @IsNotEmpty({ message: 'Email is required.' })
    @MaxLength(256, { message: 'Email must be at most 256 character.' })
    @IsEmail()
    emailId: string;

    @ApiProperty({ example: [{ 'value': 'string', 'name': 'string' }] })
    @IsNotEmpty({ message: 'Please provide valid attributes' })
    @IsArray({ message: 'attributes should be array' })
    attributes: attribute[];

    @ApiProperty({ example: 'string' })
    @IsNotEmpty({ message: 'Please provide valid credentialDefinitionId' })
    @IsString({ message: 'credentialDefinitionId should be string' })
    credentialDefinitionId: string;

    @ApiProperty({ example: 'string' })
    @IsNotEmpty({ message: 'Please provide valid comment' })
    @IsString({ message: 'comment should be string' })
    @IsOptional()
    comment: string;

    @ApiProperty({ example: 'v1' })
    @IsOptional()
    @IsNotEmpty({ message: 'Please provide valid protocol-version' })
    @IsString({ message: 'protocol-version should be string' })
    protocolVersion?: string;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty({ message: 'please provide orgId' })
    orgId: number;
}
