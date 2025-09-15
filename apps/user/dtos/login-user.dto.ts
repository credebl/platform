import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

import { Transform } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';

export class LoginUserDto {
  @ApiProperty({ example: 'awqx@yopmail.com', required: false })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsString({ message: 'Email should be a string' })
  @Transform(({ value }) => trim(value))
  email?: string;

  @ApiProperty({ example: 'Password@1', required: false })
  @IsOptional()
  @IsString({ message: 'Password should be a string' })
  password?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean({ message: 'isPasskey should be boolean' })
  isPasskey?: boolean;

  @ApiPropertyOptional({ description: 'Google OAuth ID token' })
  @ValidateIf((o) => 'google' === o.provider) // ✅ only required if provider is Google
  @IsNotEmpty({ message: 'Google ID token is required' })
  @IsString()
  idToken?: string;

  @ApiPropertyOptional({ description: 'Google OAuth ID token' })
  @ValidateIf((o) => 'google' === o.provider) // ✅ only required if provider is Google
  @IsNotEmpty({ message: 'Google ID token is required' })
  @IsString()
  // eslint-disable-next-line camelcase
  access_token?: string;

  @ApiPropertyOptional({
    example: 'google',
    description: 'Login provider (e.g., google, credentials)'
  })
  @IsOptional()
  @IsString()
  provider?: 'google' | 'credentials';
}
// export class LoginUserDto {
//   @ApiProperty({ example: 'awqx@yopmail.com' })
//   @IsEmail({}, { message: 'Please provide a valid email' })
//   @IsNotEmpty({ message: 'Email is required' })
//   @IsString({ message: 'Email should be a string' })
//   @Transform(({ value }) => trim(value))
//   email: string;

//   @ApiProperty({ example: 'Password@1' })
//   @IsOptional()
//   @IsString({ message: 'password should be string' })
//   password?: string;

//   @ApiProperty({ example: 'false' })
//   @IsOptional()
//   @IsBoolean({ message: 'isPasskey should be boolean' })
//   isPasskey?: boolean;
// }
