import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class AuthDto {
    @ApiProperty({ example: 'awqx@getnada.com' })
    @IsEmail({}, { message: 'Please provide a valid email' })
    @IsNotEmpty({ message: 'Email is required' })
    @IsString({ message: 'Email should be a string' })
    @Transform(({ value }) =>  'string' === typeof value ? value.trim() : value)
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
