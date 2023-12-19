
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class EmailValidator {

  @ApiProperty({ example: 'awqx@getnada.com' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsString({ message: 'Email should be a string' })
  @Transform(({ value }) =>  'string' === typeof value ? value.trim() : value)
  email: string;
}