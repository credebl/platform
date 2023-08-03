import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
export class ResetPasswordDto {
    @ApiProperty()
    @IsNotEmpty({message:'Please provide valid email'})
    @IsString({message:'Email should be string'})
    email: string;

    @ApiProperty()
    @IsNotEmpty({message:'Please provide valid oldPassword'})
    @IsString({message:'oldPassword should be string'})
    oldPassword: string;

    @ApiProperty()
    @IsNotEmpty({message:'Please provide valid newPassword'})
    @IsString({message:'newPassword should be string'})
    newPassword: string;
}