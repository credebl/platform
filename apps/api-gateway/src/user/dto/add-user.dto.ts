import { trim } from '@credebl/common/cast.helper';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AddUserDetailsDto {

    @ApiProperty({ example: 'awqx@getnada.com' })
    @IsEmail({}, { message: 'Please provide a valid email' })
    @IsNotEmpty({ message: 'Email is required' })
    @IsString({ message: 'Email should be a string' })
    @Transform(({ value }) => trim(value))
    email: string;

    @ApiProperty({ example: 'Alen' })
    @IsNotEmpty({ message: 'First name is required' })
    @MinLength(2, { message: 'First name must be at least 2 characters' })
    @MaxLength(50, { message: 'First name must be at most 50 characters' })
    @IsString({ message: 'First name should be a string' })
    firstName: string;

    @ApiProperty({ example: 'Harvey' })
    @IsNotEmpty({ message: 'Last name is required' })
    @MinLength(2, { message: 'Last name must be at least 2 characters' })
    @MaxLength(50, { message: 'Last name must be at most 50 characters' })
    @IsString({ message: 'Last name should be a string' })
    lastName: string;

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'Password is required' })
    password: string;

    @ApiProperty({ example: 'false' })
    @IsOptional()
    @IsBoolean({ message: 'isPasskey should be boolean' })
    isPasskey?: boolean;

    @ApiProperty({ example: '6d69e2e1-a021-4ea5-a1bc-d8b40989d6fb' })
    @IsOptional()
    @IsString({ message: 'clientId should be string' })
    clientId?: string;

    @ApiProperty({ example: 'xxxx-xxxxx-xxxxx' })
    @IsOptional()
    @IsString({ message: 'clientSecret should be string' })
    clientSecret?: string;
}

export class AddPasskeyDetailsDto {
    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'Password is required' })
    password: string;

}
