import { IsArray, IsEmail, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { toLowerCase, trim } from '@credebl/common/cast.helper';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class ProofRequestAttribute {
    @IsString()
    @IsNotEmpty({ message: 'attributeName is required.' })
    attributeName: string;

    @IsString()
    @IsNotEmpty({ message: 'schemaId is required.' })
    schemaId: string;

    @IsString()
    @IsOptional()
    @IsNotEmpty({ message: 'condition is required.' })
    condition?: string;

    @IsString()
    @IsOptional()
    @IsNotEmpty({ message: 'value is required.' })
    value?: string;

    @IsString()
    @IsOptional()
    @IsNotEmpty({ message: 'credDefId is required.' })
    credDefId?: string;
}

export class RequestProof {
    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @Transform(({ value }) => toLowerCase(value))
    @IsNotEmpty({ message: 'connectionId is required.' })
    @MaxLength(36, { message: 'connectionId must be at most 36 character.' })
    connectionId: string;

    @ApiProperty({
        'example': [
            {
                attributeName: 'attributeName',
                condition: '>=',
                value: 'predicates',
                credDefId: '',
                schemaId: ''
            }
        ]
    })
    @IsArray({ message: 'attributes must be in array' })
    @IsObject({ each: true })
    @IsNotEmpty({ message: 'please provide valid attributes' })
    attributes: ProofRequestAttribute[];

    @ApiProperty()
    @IsOptional()
    comment: string;
    orgId: number;

    @IsString({ message: 'auto accept proof must be in string' })
    @IsNotEmpty({ message: 'please provide valid auto accept proof' })
    @IsOptional()
    autoAcceptProof: string;

    @IsString({ message: 'protocolVersion must be in string' })
    @IsNotEmpty({ message: 'please provide valid protocol version' })
    @IsOptional()
    protocolVersion: string;
}

export class OutOfBandRequestProof {
    @ApiProperty({
        'example': [
            {
                attributeName: 'attributeName',
                condition: '>=',
                value: 'predicates',
                credDefId: '',
                schemaId: ''
            }
        ]
    })
    @IsArray({ message: 'attributes must be in array' })
    @IsObject({ each: true })
    @IsNotEmpty({ message: 'please provide valid attributes' })
    attributes: ProofRequestAttribute[];

    @ApiProperty({ example: ['exmaple@example.com'] })
    @IsNotEmpty({ message: 'Please provide valid emailId' })
    @Transform(({ value }) => trim(value))
    @Transform(({ value }) => toLowerCase(value))
    @IsNotEmpty({ message: 'Email is required.' })
    @MaxLength(256, { message: 'Email must be at most 256 character.' })
    @IsEmail()
    emailId: string[];

    @ApiProperty()
    @IsOptional()
    comment: string;
    orgId: number;

    @IsString({ message: 'autoAcceptProof must be in string' })
    @IsNotEmpty({ message: 'please provide valid auto accept proof' })
    @IsOptional()
    autoAcceptProof: string;

    @IsString({ message: 'protocol version must be in string' })
    @IsNotEmpty({ message: 'please provide valid protocol version' })
    @IsOptional()
    protocolVersion: string;
}
