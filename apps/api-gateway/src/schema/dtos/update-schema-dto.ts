import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateSchemaDto {
  @ApiProperty()
  @Transform(({ value }) => value?.trim())
  @IsNotEmpty({ message: 'Alias is required.' })
  @IsString({ message: 'Alias must be in string format.' })
  alias: string;

  @ApiProperty()
  @Transform(({ value }) => value?.trim())
  @IsNotEmpty({ message: 'Schema ID is required.' })
  @IsString({ message: 'Schema ID must be in string format.' })
  schemaId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @IsUUID('4')
  orgId?: string;
}
