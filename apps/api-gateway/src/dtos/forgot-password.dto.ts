import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {

    @ApiProperty({ example: 'awqx@getnada.com' })
    @IsNotEmpty({ message: 'Please provide valid username' })
    @IsString({ message: 'username should be string' })
    @IsEmail()
    username: string;

    @ApiProperty()
    @IsNotEmpty({ message: 'Please provide valid password' })
    @IsString({ message: 'password should be string' })
    password: string;
}