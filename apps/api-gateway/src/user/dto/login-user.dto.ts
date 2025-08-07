import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';

// export class LoginUserDto {
//   @ApiPropertyOptional({ example: 'awqx@yopmail.com' })
//   @ValidateIf((o) => 'google' !== o.provider) // ✅ only required if not Google
//   @IsEmail({}, { message: 'Please provide a valid email' })
//   @IsNotEmpty({ message: 'Email is required' })
//   @IsString({ message: 'Email should be a string' })
//   @Transform(({ value }) => trim(value))
//   email?: string;

//   @ApiPropertyOptional()
//   @ValidateIf((o) => 'google' !== o.provider) // ✅ only required if not Google
//   @Transform(({ value }) => trim(value))
//   @IsNotEmpty({ message: 'Password is required.' })
//   password?: string;

//   @ApiPropertyOptional({ description: 'Google OAuth ID token' })
//   @ValidateIf((o) => 'google' === o.provider) // ✅ only required if provider is Google
//   @IsNotEmpty({ message: 'Google ID token is required' })
//   @IsString()
//   idToken?: string;

//   @ApiPropertyOptional({
//     example: 'google',
//     description: 'Login provider (e.g., google, credentials)'
//   })
//   @IsOptional()
//   @IsString()
//   provider?: 'google' | 'credentials';
// }

export class LoginUserDto {
  @ApiProperty({ example: 'awqx@yopmail.com' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsString({ message: 'Email should be a string' })
  @Transform(({ value }) => trim(value))
  email: string;

  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'Password is required.' })
  password: string;
}
