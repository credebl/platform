import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString} from 'class-validator';


export class UpdateUserProfileDto {
    @ApiProperty()
    @IsNotEmpty({ message: 'userId is required.' })
    @IsNumber()
    id: number;

    @ApiProperty({ example: 'Alen' })
    @IsString({ message: 'firstName should be string' })
    @IsOptional()
    firstName?: string;

    @ApiProperty({ example: 'Harvey' })
    @IsString({ message: 'lastName should be string' })
    @IsOptional()
    lastName?: string;

    @ApiProperty({ example: 'awqx@getnada.com' })
    @IsEmail()
    @IsNotEmpty({ message: 'Please provide valid email' })
    @IsString({ message: 'email should be string' })
    email: string;
}