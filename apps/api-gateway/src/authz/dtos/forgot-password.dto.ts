import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator'

import { trim } from '@credebl/common/cast.helper'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'

export class ForgotPasswordDto {
  @ApiProperty({ example: 'awqx@yopmail.com' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsString({ message: 'Email should be a string' })
  @Transform(({ value }) => trim(value))
  email: string

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsUrl(
    {
      require_protocol: true,

      require_tld: true,
    },
    { message: 'brandLogoUrl should be a valid URL' }
  )
  brandLogoUrl?: string

  @ApiPropertyOptional({ example: 'MyPlatform' })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsString({ message: 'platformName should be string' })
  platformName?: string

  @ApiPropertyOptional({ example: 'https://0.0.0.0:5000' })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsString({ message: 'endpoint should be string' })
  endpoint?: string
}
