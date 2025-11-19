import { trim } from '@credebl/common/cast.helper';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsEmail } from 'class-validator';
export class ResetPasswordDto {
    @ApiProperty({ example: 'awqx@getnada.com' })
    @IsEmail({}, { message: 'Please provide a valid email' })
    @IsNotEmpty({ message: 'Email is required' })
    @IsString({ message: 'Email should be a string' })
    @Transform(({ value }) => trim(value))
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