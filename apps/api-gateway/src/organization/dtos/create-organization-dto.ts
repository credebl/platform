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
  @MaxLength(50, { message: 'Organization name must be at most 50 characters.' })
  @IsString({ message: 'Organization name must be in string format.' })
  @IsNotSQLInjection({ message: 'Organization name is required.' })
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

  @ApiProperty({ example: 'IN' })
  @IsNotEmpty({ message: 'country is required' })
  @MinLength(2, { message: 'country must be at least 2 characters' })
  @MaxLength(50, { message: 'country must be at most 50 characters' })
  @IsNumber()
  countryId?: number;

  @ApiProperty({ example: 'MH' })
  @IsNotEmpty({ message: 'state is required' })
  @MinLength(2, { message: 'state must be at least 2 characters' })
  @MaxLength(50, { message: 'state must be at most 50 characters' })
  @IsNumber()
  stateId?: number;

  @ApiProperty({ example: 'Mumbai' })
  @IsNotEmpty({ message: 'city is required' })
  @MinLength(2, { message: 'city must be at least 2 characters' })
  @MaxLength(50, { message: 'city must be at most 50 characters' })
  @IsNumber()
  cityId?: number;
}
