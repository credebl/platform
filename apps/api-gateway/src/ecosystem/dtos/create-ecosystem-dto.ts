import { ApiExtraModels, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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
    description: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) => trim(value))
    @IsString({ message: 'tag must be in string format.' })
    tag: string;
    
    @ApiPropertyOptional()
    @IsInt({ message: 'orgId must be in number format.' })
    orgId: number;

    @ApiPropertyOptional()
    @IsInt({ message: 'UserId must be in number format.' })
    userId: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) => trim(value))
    @IsString({ message: 'logo must be in string format.' })
    logo: string;
}