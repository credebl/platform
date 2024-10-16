import { ApiExtraModels, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

import { Transform } from 'class-transformer';
import { IsNotSQLInjection, trim } from '@credebl/common/cast.helper';

@ApiExtraModels()
export class CreateOrganizationDto {
  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'Organization name is required.' })
  @MinLength(2, { message: 'Organization name must be at least 2 characters.' })
  @MaxLength(200, { message: 'Organization name must be at most 200 characters.' })
  @IsString({ message: 'Organization name must be in string format.' })
  @IsNotSQLInjection({ message: 'Incorrect pattern for organization name.' })
  name: string;

  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'Description is required.' })
  @MinLength(2, { message: 'Description must be at least 2 characters.' })
  @MaxLength(1000, { message: 'Description must be at most 1000 characters.' })
  @IsString({ message: 'Description must be in string format.' })
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trim(value))
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'notificationWebhook is required.' })
  @IsString({ message: 'notificationWebhook must be in string format.' })
  @IsUrl({
    // eslint-disable-next-line camelcase
    require_protocol: true, // require URL protocol (e.g., http:// or https://)
    // eslint-disable-next-line camelcase
    require_tld: true // require top-level domain (e.g., .com, .net)
  })
  notificationWebhook?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'logo must be in string format.' })
  logo?: string = '';

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'registrationNumber must be in string format.' })
  registrationNumber?: string;

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
