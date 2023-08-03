import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UserOrgProfileDto {
    @ApiProperty()
    @IsNotEmpty({message:'Please provide valid firstName'})
    @IsString({message:'FirstName should be string'})
    firstName?: string;

    @ApiProperty()
    @IsNotEmpty({message:'Please provide valid lastName'})
    @IsString({message:'LastName should be string'})
    lastName?: string;
}