import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsNumber } from 'class-validator';

export class CreateTenantSchemaDto {
    @ApiProperty()
    @IsString({ message: 'tenantId must be a string' }) @IsNotEmpty({ message: 'please provide valid tenantId' })
    tenantId: string;
    
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
}