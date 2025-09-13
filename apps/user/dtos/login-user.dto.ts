import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import type { Prisma } from '@prisma/client';
import { Transform } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';

export class LoginUserDto {
  @ApiProperty({ example: 'awqx@yopmail.com' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsString({ message: 'Email should be a string' })
  @Transform(({ value }) => trim(value))
  email: string;

  @ApiProperty({ example: 'Password@1' })
  @IsOptional()
  @IsString({ message: 'password should be string' })
  password?: string;

  @ApiProperty({ example: 'false' })
  @IsOptional()
  @IsBoolean({ message: 'isPasskey should be boolean' })
  isPasskey?: boolean;

  @ApiProperty({ example: 'false' })
  @IsOptional()
  clientInfo?: Prisma.JsonValue;
}
