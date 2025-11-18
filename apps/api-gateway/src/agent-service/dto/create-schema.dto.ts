import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, ArrayNotEmpty } from 'class-validator';

export class CreateTenantSchemaDto {
  @ApiProperty()
  @IsString({ message: 'tenantId must be a string' })
  @IsNotEmpty({ message: 'please provide valid tenantId' })
  tenantId: string;

  @ApiProperty()
  @IsString({ message: 'schema version must be a string' })
  @IsNotEmpty({ message: 'please provide valid schema version' })
  schemaVersion: string;

  @ApiProperty()
  @IsString({ message: 'schema name must be a string' })
  @IsNotEmpty({ message: 'please provide valid schema name' })
  schemaName: string;

  @ApiProperty()
  @IsArray({ message: 'attributes must be an array' })
  @ArrayNotEmpty({ message: 'please provide at least one attribute' })
  @IsString({ each: true, message: 'each attribute must be a string' })
  @IsNotEmpty({ each: true, message: 'attribute must not be empty' })
  attributes: string[];

  @ApiProperty()
  @IsString({ message: 'orgId must be a string' })
  @IsNotEmpty({ message: 'please provide orgId' })
  orgId: string;
}
