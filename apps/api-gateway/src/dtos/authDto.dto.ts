import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class AuthDto {
    @ApiProperty({ example: 'awqx@getnada.com' })
    @IsEmail()
    @IsNotEmpty({ message: 'Please provide valid email' })
    @IsString({ message: 'email should be string' })
    email: string;

    @IsOptional()
    @IsBoolean({ message: 'flag should be boolean' })
    flag: boolean;

    @IsOptional()
    @ApiProperty({ example: 'Password@1' })
    @IsNotEmpty({ message: 'Please provide valid password' })
    @IsString({ message: 'password should be string' })
    password: string;
}
