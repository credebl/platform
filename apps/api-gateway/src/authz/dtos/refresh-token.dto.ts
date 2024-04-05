import { IsNotEmpty } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {  trim } from '@credebl/common/cast.helper';

export class RefreshTokenDto {
 
    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'refreshToken is required.' })
    refreshToken: string;

}