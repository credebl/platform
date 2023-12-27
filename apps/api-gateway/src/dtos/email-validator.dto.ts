
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class EmailValidator {

  @ApiProperty()
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty({ message: 'Email is required' })  
  @MaxLength(256, { message: 'Email must be at most 256 character.' })
  @IsEmail()
  email: string;
}