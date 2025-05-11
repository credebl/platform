import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { toLowerCase, trim } from '@credebl/common/cast.helper';

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';


export class EmailVerificationDto {
    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @Transform(({ value }) => toLowerCase(value))
    @IsNotEmpty({ message: 'Email is required.' })
    @MaxLength(256, { message: 'Email must be at most 256 character.' })
    @IsEmail({}, { message: 'Please provide a valid email' })
    @MaxLength(256, { message: 'Email must be at most 256 character' })
    email: string;

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'Verification code is required.' })
    @IsString({ message: 'Verification code should be string' })
    verificationCode: string;
}
