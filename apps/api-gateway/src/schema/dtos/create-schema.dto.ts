import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreateSchemaDto {
    @ApiProperty()
    @IsString({ message: 'schema version must be a string' }) @IsNotEmpty({ message: 'please provide valid schema version' })
    schemaVersion: string;

    @ApiProperty()
    @IsString({ message: 'schema name must be a string' }) @IsNotEmpty({ message: 'please provide valid schema name' })
    schemaName: string;

    @ApiProperty()
    @IsArray({ message: 'attributes must be an array' })
    @IsString({ each: true })
    @IsNotEmpty({ message: 'please provide valid attributes' })
    attributes: string[];

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty({ message: 'please provide orgId' })
    orgId: number;

    @ApiProperty()
    @IsString({ message: 'orgDid must be a string' }) @IsNotEmpty({ message: 'please provide valid orgDid' })
    orgDid: string;
}
