import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { toLowerCase, trim } from '@credebl/common/cast.helper';

import { Transform } from 'class-transformer';

export class UserEmailVerificationDto {
  @ApiProperty({ example: 'awqx@yopmail.com' })
  @Transform(({ value }) => trim(value))
  @Transform(({ value }) => toLowerCase(value))
  @IsNotEmpty({ message: 'Email is required.' })
  @MaxLength(256, { message: 'Email must be at most 256 character.' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  email: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsUrl(
    {
      // eslint-disable-next-line camelcase
      require_protocol: true,
      // eslint-disable-next-line camelcase
      require_tld: true
    },
    { message: 'brandLogoUrl should be a valid URL' }
  )
  brandLogoUrl?: string;

  @ApiPropertyOptional({ example: 'MyPlatform' })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsString({ message: 'platformName should be string' })
  platformName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'clientAlias should be string' })
  @Transform(({ value }) => trim(value))
  clientAlias?: string;
}
