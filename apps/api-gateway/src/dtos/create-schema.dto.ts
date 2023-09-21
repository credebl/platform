import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

class AttributeValue {

    @IsString()
    @IsNotEmpty({ message: 'attributeName is required.' })
    attributeName: string;

    @IsString()
    @IsNotEmpty({ message: 'schemaDataType is required.' })
    schemaDataType: string;

    @IsString()
    @IsNotEmpty({ message: 'displayName is required.' })
    displayName: string;
}

export class CreateSchemaDto {
    @ApiProperty()
    @IsString({ message: 'schema version must be a string' }) @IsNotEmpty({ message: 'please provide valid schema version' })
    schemaVersion: string;

    @ApiProperty()
    @IsString({ message: 'schema name must be a string' }) @IsNotEmpty({ message: 'please provide valid schema name' })
    schemaName: string;

    @ApiProperty({
        'example': [
            {
                attributeName: 'name',
                schemaDataType: 'string',
                displayName: 'Name'
            }
        ]
    })
    @IsArray({ message: 'attributes must be an array' })
    @IsNotEmpty({ message: 'please provide valid attributes' })
    attributes: AttributeValue[];

    orgId: number;

    @ApiProperty()
    @IsOptional()
    @IsString({ message: 'orgDid must be a string' })
    orgDid: string;
}
