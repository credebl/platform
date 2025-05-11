import { IsArray, IsNotEmpty, IsString } from 'class-validator';

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
    
    @IsNotEmpty({ message: 'please provide orgId' })
    orgId: string;

    @ApiProperty()
    @IsString({ message: 'orgDid must be a string' }) @IsNotEmpty({ message: 'please provide valid orgDid' })
    orgDid: string;
}
