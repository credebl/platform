import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';

export class HolderResetPasswordDto {
    @ApiProperty({ example: 'awqx@getnada.com' })
    @IsEmail({}, { message: 'Please provide a valid email' })
    @IsNotEmpty({ message: 'Email is required' })
    @IsString({ message: 'Email should be a string' })
    @Transform(({ value }) => trim(value))
    email: string;

    @ApiProperty({ example: '$2b$10$.NcA4.oN.a8otc5TgGuO5OvH.hbaF/AWNvVfA1t7g3N9jstvzJTlm' })
    @IsNotEmpty({ message: 'Please provide valid password' })
    @IsString({ message: 'password should be string' })
    password: string;


    @ApiProperty({ example: '647bf6c8b888b6a269ca' })
    @IsNotEmpty({ message: 'Please provide valid token' })
    @IsString({ message: 'token should be string' })
    token: string;
}