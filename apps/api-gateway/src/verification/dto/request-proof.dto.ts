import { IsArray, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { toLowerCase, trim } from '@credebl/common/cast.helper';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IProofRequestAttribute } from '../interfaces/verification.interface';

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
                credDefId: ''
            }
        ]
    })
    @IsArray({ message: 'attributes must be in array' })
    @IsObject({ each: true })
    @IsNotEmpty({ message: 'please provide valid attributes' })
    attributes: IProofRequestAttribute[];

    @ApiProperty()
    @IsOptional()
    comment: string;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty({ message: 'please provide orgId' })
    orgId: number;

    @IsString({ message: 'autoAcceptProof must be in string' })
    @IsNotEmpty({ message: 'please provide valid autoAcceptProof' })
    @IsOptional()
    autoAcceptProof: string;

    @IsString({ message: 'protocolVersion must be in string' })
    @IsNotEmpty({ message: 'please provide valid protocolVersion' })
    @IsOptional()
    protocolVersion: string;
}
