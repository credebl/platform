import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class SendEcosystemCreateDto {
  @ApiProperty({ example: 'awqx@yopmail.com' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsString({ message: 'Email should be a string' })
  @Transform(({ value }) => value?.trim())
  email: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'User ID is required' })
  @IsString({ message: 'User ID should be a string' })
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  userId: string;
}
