import { ApiExtraModels, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { Transform } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';

@ApiExtraModels()
export class CreateOrganizationDto {

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'Organization name is required.' })
    @MinLength(2, { message: 'Organization name must be at least 2 characters.' })
    @MaxLength(50, { message: 'Organization name must be at most 50 characters.' })
    @IsString({ message: 'Organization name must be in string format.' })
    name: string;

    @ApiPropertyOptional()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'Description is required.' })
    @MinLength(2, { message: 'Description must be at least 2 characters.' })
    @MaxLength(255, { message: 'Description must be at most 255 characters.' })
    @IsString({ message: 'Description must be in string format.' })
    description: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) => trim(value))
    @IsString({ message: 'logo must be in string format.' })
    logo: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) => trim(value))
    website?: string;
    
}