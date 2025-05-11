import { IsNotEmpty } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {  trim } from '@credebl/common/cast.helper';

export class ResetTokenPasswordDto {
 
    email: string;

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'password is required.' })
    password: string;

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'token is required.' })
    token: string;


}