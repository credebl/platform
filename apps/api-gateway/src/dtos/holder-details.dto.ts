import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';

export class HolderDetailsDto {
    @ApiProperty({ example: 'Alen' })
    @IsNotEmpty({ message: 'Please provide valid firstName' })
    @IsString({ message: 'firstName should be string' })
    firstName: string;

    @ApiProperty({ example: 'Harvey' })
    @IsNotEmpty({ message: 'Please provide valid lastName' })
    @IsString({ message: 'lastName should be string' })
    lastName: string;

    @ApiProperty({ example: 'awqx@getnada.com' })
    @IsEmail({}, { message: 'Please provide a valid email' })
    @IsNotEmpty({ message: 'Email is required' })
    @IsString({ message: 'Email should be a string' })
    @Transform(({ value }) => trim(value))
    email: string;

    @ApiProperty({ example: 'awqx@example.com' })
    @IsEmail({}, { message: 'Please provide a valid email' })
    @IsNotEmpty({ message: 'Please provide valid username' })
    @IsString({ message: 'username should be string' })
    username: string;

    @ApiProperty({ example: 'your-secret-password' })
    @IsNotEmpty({ message: 'Please provide valid password' })
    @IsString({ message: 'password should be string' })
    password: string;

    @ApiProperty({ example: 'GamoraPlus' })
    @IsNotEmpty({ message: 'Please provide valid deviceId' })
    @IsString({ message: 'deviceId should be string' })
    deviceId: string;

    @ApiProperty({ example: 'Nokia C3' })
    @IsNotEmpty({ message: 'Please provide valid model' })
    @IsString({ message: 'model should be string' })
    model: string;

    @ApiProperty({ example: 'Nokia' })
    @IsNotEmpty({ message: 'Please provide valid type' })
    @IsString({ message: 'type should be string' })
    type: string;

    @ApiProperty({ example: 'Android' })
    @IsNotEmpty({ message: 'Please provide valid os' })
    @IsString({ message: 'os should be string' })
    os: string;

    // @ApiProperty()
    // mediatorId?: number;

    @ApiProperty({ example: 'https://yourdomain.com/my-profile-logo.png' })
    // @IsNotEmpty({ message: 'Please provide valid profileLogoUrl' })
    // @IsString({ message: 'profileLogoUrl should be string' })
    profileLogoUrl: string;

    @ApiProperty({ example: 'your-firebase-token' })
    @IsNotEmpty({ message: 'Please provide valid firebaseToken' })
    @IsString({ message: 'firebaseToken should be string' })
    firebaseToken: string;
}