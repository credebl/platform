import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { toLowerCase, trim } from '@credebl/common/cast.helper';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UserEmailVerificationDto {
    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @Transform(({ value }) => toLowerCase(value))
    @IsNotEmpty({ message: 'Email is required.' })
    @MaxLength(256, { message: 'Email must be at most 256 character.' })
    @IsEmail({}, { message: 'Please provide a valid email' })
    email: string;

    @ApiProperty({ example: 'xxxx-xxxx-xxxx' })
    @IsString({ message: 'clientId should be string' })
    clientId: string;

    @ApiProperty({ example: 'xxxx-xxxxx-xxxxx' })
    @IsString({ message: 'clientSecret should be string' })
    clientSecret: string;

    @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
    @Transform(({ value }) => trim(value))
    @IsOptional()
    @IsUrl({
    // eslint-disable-next-line camelcase 
        require_protocol: true,
    // eslint-disable-next-line camelcase
      require_tld: true
    },
    { message: 'brandLogoUrl should be a valid URL' })
    brandLogoUrl?: string;

  @ApiPropertyOptional({ example: 'MyPlatform' })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsString({ message: 'platformName should be string' })
  platformName?: string;
}
