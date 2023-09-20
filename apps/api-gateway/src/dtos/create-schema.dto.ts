import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

interface IAttributeValue{
    attributeName: string;
    schemaDataType: string;
    displayName: string;
}

export class CreateSchemaDto {
    @ApiProperty()
    @IsString({ message: 'schema version must be a string' }) @IsNotEmpty({ message: 'please provide valid schema version' })
    schemaVersion: string;

    @ApiProperty()
    @IsString({ message: 'schema name must be a string' }) @IsNotEmpty({ message: 'please provide valid schema name' })
    schemaName: string;

    @ApiProperty()
    @IsArray({ message: 'attributes must be an array' })
    @IsNotEmpty({ message: 'please provide valid attributes' })
    attributes: IAttributeValue[];

    orgId: number;

    @ApiProperty()
    @IsOptional()
    @IsString({ message: 'orgDid must be a string' })
    orgDid: string;
}
