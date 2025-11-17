/* eslint-disable camelcase */
import { ApiExtraModels, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumberString, IsString, MaxLength, MinLength } from 'class-validator';

import { Transform } from 'class-transformer';
import { toLowerCase, trim } from '@credebl/common/cast.helper';


@ApiExtraModels()
export class RegisterTenantDto {

  @ApiProperty({ example: 'awqx@getnada.com' })
  @Transform(({ value }) => toLowerCase(value))
  @IsNotEmpty({ message: 'Email is required.' })
  @MaxLength(256, { message: 'Email must be at most 256 character.' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsString({ message: 'Email should be a string' })
  @Transform(({ value }) => trim(value))
  email: string;

  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'Password is required.' })
  password: string;

  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'Organization name is required.' })
  @MinLength(2, { message: 'Organization name must be at least 2 characters.' })
  @MaxLength(50, { message: 'Organization name must be at most 50 characters.' })
  @IsString({ message: 'Organization name must be in string format.' })
  orgName: string;

  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'First name is required.' })
  @MinLength(1, { message: 'First name must be at least 2 characters.' })
  @MaxLength(50, { message: 'First name must be at most 50 characters.' })
  @IsString({ message: 'First name must be in string format.' })
  firstName: string;

  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'Last name is required.' })
  @MinLength(1, { message: 'Last name must be at least 2 characters.' })
  @MaxLength(50, { message: 'Last name must be at most 50 characters.' })
  @IsString({ message: 'Last name must be in string format.' })
  lastName: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Organization categoty is required.' })
  @IsNumberString()
  orgCategory: number;

  @ApiPropertyOptional()
  logoUri?: string;


  @ApiPropertyOptional()
  @Transform(({ value }) => trim(value))
  solutionTitle?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => trim(value))
  solutionDesc?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => trim(value))
  address?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => trim(value))
  website?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => trim(value))
  tags?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => trim(value))
  Keywords: string;
}
