import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';

class AttributeValue {

    @ApiProperty()
    @IsString()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'attributeName is required' })
    attributeName: string;

    @ApiProperty()
    @IsString()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'schemaDataType is required' })
    schemaDataType: string;

    @ApiProperty()
    @IsString()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'displayName is required' })
    displayName: string;
}

export class CreateSchemaDto {
    @ApiProperty()
    @IsString({ message: 'schemaVersion must be a string' }) 
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'schemaVersion is required' })
    schemaVersion: string;

    @ApiProperty()
    @IsString({ message: 'schemaName must be a string' })
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'schemaName is required' })
    schemaName: string;

    @ApiProperty({
        type: [AttributeValue],
        'example': [
            {
                attributeName: 'name',
                schemaDataType: 'string',
                displayName: 'Name'
            }
        ]
    })
    @IsArray({ message: 'attributes must be an array' })
    @IsNotEmpty({ message: 'attributes are required' })
    @ValidateNested({ each: true })
    @Type(() => AttributeValue)
    attributes: AttributeValue[];

    orgId: string;

    @ApiPropertyOptional()
    @Transform(({ value }) => trim(value))
    @IsOptional()
    @IsNotEmpty({ message: 'orgDid should not be empty' })
    @IsString({ message: 'orgDid must be a string' })
    orgDid: string;
}
