import { IsArray, IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsNumberString, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { toLowerCase, trim } from '@credebl/common/cast.helper';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { AutoAccept } from '@credebl/enum/enum';
import { IProofFormats } from '../interfaces/verification.interface';

export class ProofRequestAttribute {
    @IsString()
    @IsNotEmpty({ message: 'attributeName is required.' })
    attributeName: string;

    @IsString()
    @IsOptional()
    schemaId?: string;

    @IsString()
    @IsOptional()
    @IsNotEmpty({ message: 'condition is required.' })
    condition?: string;

    @IsOptional()
    @IsNotEmpty({ message: 'value is required.' })
    @IsNumberString({}, { message: 'Value must be a number' })
    value?: string;

    @IsString()
    @IsOptional()
    credDefId?: string;
}

class ProofPayload {
    @ApiPropertyOptional()
    @IsString({ message: 'goalCode must be in string' })
    @IsNotEmpty({ message: 'please provide valid goalCode' })
    @IsOptional()
    goalCode: string;

    @ApiPropertyOptional()
    @IsString({ message: 'parentThreadId must be in string' })
    @IsNotEmpty({ message: 'please provide valid parentThreadId' })
    @IsOptional()
    parentThreadId: string;

    @ApiPropertyOptional()
    @IsBoolean({ message: 'willConfirm must be in boolean' })
    @IsNotEmpty({ message: 'please provide valid willConfirm' })
    @IsOptional()
    willConfirm: boolean;

    @ApiPropertyOptional()
    @IsString({ message: 'protocolVersion must be in string' })
    @IsNotEmpty({ message: 'please provide valid protocol version' })
    @IsOptional()
    protocolVersion: string;
}

export class RequestProofDto extends ProofPayload {
    @ApiProperty()
    @IsString()
    @Transform(({ value }) => trim(value))
    @Transform(({ value }) => toLowerCase(value))
    @IsNotEmpty({ message: 'connectionId is required.' })
    connectionId: string;

    @ApiProperty({
        'example': [
            {
                attributeName: 'attributeName',
                condition: '>=',
                value: 'predicates',
                credDefId: 'string',
                schemaId: 'string'
            }
        ]
    })
    @IsArray({ message: 'attributes must be in array' })
    @IsObject({ each: true })
    @IsNotEmpty({ message: 'please provide valid attributes' })
    attributes: ProofRequestAttribute[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({ message: 'comment must be in string' })
    comment: string;

    orgId: string;

    @ApiPropertyOptional()
    @IsString({ message: 'auto accept proof must be in string' })
    @IsNotEmpty({ message: 'please provide valid auto accept proof' })
    @IsOptional()
    @IsEnum(AutoAccept, {
        message: `Invalid auto accept proof. It should be one of: ${Object.values(AutoAccept).join(', ')}`
    })
    autoAcceptProof: AutoAccept;
}

export class OutOfBandRequestProof extends ProofPayload {
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
    @IsEmail({}, { message: 'Please provide a valid email' })
    @IsNotEmpty({ message: 'Email is required' })
    @Transform(({ value }) => trim(value))
    @IsString({ each: true, message: 'Each emailId in the array should be a string' })
    @IsOptional()
    emailId?: string | string[];

    @ApiProperty()
    @IsOptional()
    comment: string;
    orgId: string;

    @ApiPropertyOptional()
    @IsString({ message: 'auto accept proof must be in string' })
    @IsNotEmpty({ message: 'please provide valid auto accept proof' })
    @IsOptional()
    @IsEnum(AutoAccept, {
        message: `Invalid auto accept proof. It should be one of: ${Object.values(AutoAccept).join(', ')}`
    })
    autoAcceptProof: string;
}

export class SendProofRequestPayload {

    @ApiPropertyOptional()
    @IsString({ message: 'protocolVersion must be in string' })
    @IsNotEmpty({ message: 'please provide valid protocol version' })
    @IsOptional()
    protocolVersion: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({ message: 'comment must be in string' })
    comment: string;

    @ApiProperty({
        'example': [
            {
                indy: {
                    name: 'Verify national identity',
                    version: '1.0',
                    // eslint-disable-next-line camelcase
                    requested_attributes: {
                        verifynameAddress: {
                            names: ['name', 'address'],
                            restrictions: [{'schema_id': 'KU583UbI4yAKfaBTSz1rqG:2:National ID:1.0.0'}]
                        },
                        verifyBirthPlace: {
                            name: 'Place',
                            restrictions: [{'schema_id': 'KU583UbI4yAKfaBTSz1rqG:2:Birth Certificate:1.0.0'}]
                        }
                    },
                    // eslint-disable-next-line camelcase
                    requested_predicates: {}
                }
            }
        ]
    })
    @IsObject({ each: true })
    @IsNotEmpty({ message: 'please provide valid proofFormat' })
    proofFormats: IProofFormats;

    @ApiPropertyOptional()
    @IsString({ message: 'auto accept proof must be in string' })
    @IsNotEmpty({ message: 'please provide from valid auto accept proof options' })
    @IsOptional()
    @IsEnum(AutoAccept, {
        message: `Invalid auto accept proof. It should be one of: ${Object.values(AutoAccept).join(', ')}`
    })
    autoAcceptProof: AutoAccept;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({ message: 'label must be in string' })
    label: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    @IsNotEmpty({ message: 'please provide valid parentThreadId' })
    parentThreadId: string;  
}

