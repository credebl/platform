import { ApiExtraModels, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsBoolean, MaxLength, MinLength, Validate, IsNumber } from 'class-validator';

import { Transform } from 'class-transformer';
import { ImageBase64Validator, IsNotSQLInjection, trim } from '@credebl/common/cast.helper';

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
  @IsNotSQLInjection({ message: 'Incorrect pattern for organization name.' })
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

  @ApiPropertyOptional({ example: 101 })
  @IsOptional()
  @IsNotEmpty({ message: 'country is required' })
  @IsNumber({}, { message: 'countryId must be a number' })
  countryId?: number;

  @ApiPropertyOptional({ example: 4008 })
  @IsOptional()
  @IsNotEmpty({ message: 'state is required' })
  @IsNumber({}, { message: 'stateId must be a number' })
  stateId?: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @IsNotEmpty({ message: 'city is required' })
  @IsNumber({}, { message: 'cityId must be a number' })
  cityId?: number;
}
