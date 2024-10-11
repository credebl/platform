import { ApiExtraModels, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsBoolean, MaxLength, MinLength, Validate } from 'class-validator';

import { Transform } from 'class-transformer';
import { ImageBase64Validator, trim } from '@credebl/common/cast.helper';

@ApiExtraModels()
export class UpdateOrganizationDto {


    orgId: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'Organization name is required.' })
    @MinLength(2, { message: 'Organization name must be at least 2 characters.' })
    @MaxLength(200, { message: 'Organization name must be at most 200 characters.' })
    @IsString({ message: 'Organization name must be in string format.' })
    name: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'Description is required.' })
    @MinLength(2, { message: 'Description must be at least 2 characters.' })
    @MaxLength(1000, { message: 'Description must be at most 1000 characters.' })
    @IsString({ message: 'Description must be in string format.' })
    description: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) => trim(value))
    @Validate(ImageBase64Validator)
    logo?: string = '';

    @ApiPropertyOptional()
    @IsOptional()
    website?: string;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean({ message: 'isPublic should be boolean' })
    @IsOptional()
    isPublic?: boolean = false;

}