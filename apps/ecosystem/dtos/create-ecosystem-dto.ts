import { ApiExtraModels, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { IsNotSQLInjection, trim } from '@credebl/common/cast.helper';
import { Transform, Type } from 'class-transformer';

@ApiExtraModels()
export class CreateEcosystemDto {
  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'Ecosystem name is required.' })
  @MinLength(2, { message: 'Ecosystem name must be at least 2 characters.' })
  @MaxLength(50, { message: 'Ecosystem name must be at most 50 characters.' })
  @IsString({ message: 'Ecosystem name must be in string format.' })
  @IsNotSQLInjection({ message: 'Incorrect pattern for ecosystem name.' })
  name: string;

  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'Description is required.' })
  @MinLength(2, { message: 'Description must be at least 2 characters.' })
  @MaxLength(255, { message: 'Description must be at most 255 characters.' })
  @IsString({ message: 'Description must be in string format.' })
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'tag must be in string format.' })
  @Type(() => String)
  tags?: string;

  userId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'logo must be in string format.' })
  logo?: string;

  orgId?: string;
}
