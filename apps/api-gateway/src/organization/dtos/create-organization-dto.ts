import { ApiExtraModels, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

import { Transform } from 'class-transformer';
import { IsNotSQLInjection, trim } from '@credebl/common/cast.helper';
import { GeoLocationDto } from '../../dtos/geo-location-dto';

@ApiExtraModels()
export class CreateOrganizationDto extends GeoLocationDto {
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
}
