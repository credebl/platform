import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {  trim } from '@credebl/common/cast.helper';

export class LoginUserDto {
    @ApiProperty({ example: 'awqx@getnada.com' })
    @IsEmail({}, { message: 'Please provide a valid email' })
    @IsNotEmpty({ message: 'Email is required' })
    @IsString({ message: 'Email should be a string' })
    @Transform(({ value }) => trim(value))
    email: string;

    @ValidateIf((obj) => false === obj.isPasskey)
    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'Password is required.' })
    password?: string;

    @ApiProperty({ example: 'false' })
    @IsOptional()
    @IsBoolean({ message: 'isPasskey should be boolean' })
    isPasskey: boolean;
}


export class LoginUserNameDto {
    @ApiProperty({ example: '098f6bcd4621d373cade4e832627b4f8' })
    @IsNotEmpty({ message: 'username is required' })
    @IsString({ message: 'username should be a string' })
    @Transform(({ value }) => trim(value))
    username: string;

    @ValidateIf((obj) => false === obj.isPasskey)
    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'Password is required.' })
    password?: string;

    @ApiProperty({ example: 'false' })
    @IsOptional()
    @IsBoolean({ message: 'isPasskey should be boolean' })
    isPasskey: boolean;
}