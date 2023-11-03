import { ApiExtraModels, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { Transform } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';

@ApiExtraModels()
export class CreateEcosystemDto {

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'ecosystem name is required.' })
    @MinLength(2, { message: 'ecosystem name must be at least 2 characters.' })
    @MaxLength(50, { message: 'ecosystem name must be at most 50 characters.' })
    @IsString({ message: 'ecosystem name must be in string format.' })
    name: string;
  
    @ApiPropertyOptional()
    @Transform(({ value }) => trim(value))
    @MinLength(2, { message: 'Description must be at least 2 characters.' })
    @MaxLength(255, { message: 'Description must be at most 255 characters.' })
    @IsString({ message: 'Description must be in string format.' })
    @IsOptional()
    description?: string;
  
    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) => trim(value))
    @IsString({ message: 'tag must be in string format.' })
    tags?: string;
  
    @ApiPropertyOptional()
    
    userId: string;
  
    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) => trim(value))
    @IsString({ message: 'logo must be in string format.' })
    logo?: string;

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'organization name is required.' })
    @MinLength(2, { message: 'organization name must be at least 2 characters.' })
    @MaxLength(50, { message: 'organization name must be at most 50 characters.' })
    @IsString({ message: 'organization name must be in string format.' })
    orgName: string;

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'organization did is required.' })
    @IsString({ message: 'organization did must be in string format.' })
    orgDid: string;

    @ApiPropertyOptional({ example: 'false' })
    @IsBoolean()
    @IsOptional()
    @IsNotEmpty({ message: 'autoEndorsement should be boolean value' })
    autoEndorsement = false;

    orgId?: string;
  }
  