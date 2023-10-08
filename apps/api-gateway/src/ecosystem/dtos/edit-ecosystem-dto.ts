import { ApiExtraModels, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { Transform } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';

@ApiExtraModels()
export class EditEcosystemDto {
    @ApiPropertyOptional()
    @Transform(({ value }) => trim(value))
    @IsOptional()
    @IsNotEmpty({ message: 'Ecosystem name is required.' })
    @MinLength(2, { message: 'Ecosystem name must be at least 2 characters.' })
    @MaxLength(50, { message: 'Ecosystem name must be at most 50 characters.' })
    @IsString({ message: 'Ecosystem name must be in string format.' })
    name?: string;
  
    @ApiPropertyOptional()
    @Transform(({ value }) => trim(value))
    @IsOptional()
    @MinLength(2, { message: 'Description must be at least 2 characters.' })
    @MaxLength(255, { message: 'Description must be at most 255 characters.' })
    @IsString({ message: 'Description must be in string format.' })
    description?: string;
  
    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) => trim(value))
    @IsString({ message: 'tag must be in string format.' })
    tags?: string;
  
    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) => trim(value))
    @IsString({ message: 'logo must be in string format.' })
    logo?: string;
  }
  