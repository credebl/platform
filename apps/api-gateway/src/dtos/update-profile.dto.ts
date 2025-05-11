import { IsNotEmpty, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { trim } from '@credebl/common/cast.helper';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {

    @ApiProperty()
    @IsNotEmpty({message:'Please provide valid firstName'})
    @IsString({message:'FirstName should be string'})
    firstName: string;

    @ApiProperty()
    @IsNotEmpty({message:'Please provide valid lastName'})
    @IsString({message:'LastName should be string'})
    lastName: string;

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({message:'Please provide valid profileLogoUrl'})
    @IsString({message:'ProfileLogoUrl should be string'})
    profileLogoUrl?: string;
}
