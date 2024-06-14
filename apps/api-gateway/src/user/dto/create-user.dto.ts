import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { toLowerCase, trim } from '@credebl/common/cast.helper';

import { ApiProperty } from '@nestjs/swagger';
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
}
