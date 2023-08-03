import { IsNotEmpty, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class HolderResetPasswordDto {
    @ApiProperty({ example: 'abc@getnada.com' })
    @IsNotEmpty({ message: 'Please provide valid email' })
    @IsString({ message: 'Email should be string' })
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