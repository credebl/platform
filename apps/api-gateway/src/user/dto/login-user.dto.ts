import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {  trim } from '@credebl/common/cast.helper';

export class LoginUserDto {
    @ApiProperty({ example: 'awqx@getnada.com'})
    @IsEmail({}, { message: 'Please provide a valid email' })
    @IsNotEmpty({ message: 'Email is required' }) 
    @IsString({ message: 'email should be string' })
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