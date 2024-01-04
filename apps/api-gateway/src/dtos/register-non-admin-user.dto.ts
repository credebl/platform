import { trim } from '@credebl/common/cast.helper';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsEmail, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class RegisterNonAdminUserDto {
    @ApiProperty()
    @IsNotEmpty({message:'Please provide valid firstName'})
    @IsString({message:'FirstName should be string'})
    firstName: string;

    @ApiProperty()
    @IsNotEmpty({message:'Please provide valid lastName'})
    @IsString({message:'LastName should be string'})
    lastName: string;

    @ApiProperty({ example: 'awqx@getnada.com' })
    @IsEmail({}, { message: 'Please provide a valid email' })
    @IsNotEmpty({ message: 'Email is required' })
    @IsString({ message: 'Email should be a string' })
    @Transform(({ value }) => trim(value))
    email: string;

    @ApiPropertyOptional()
    // @IsNotEmpty({message:'Please provide valid username'})
    // @IsString({message:'Username should be string'})
    username: string;

    @ApiProperty()
    @IsNotEmpty({message:'Please provide valid password'})
    @IsString({message:'Password should be string'})
    password: string;

    @ApiProperty()
    @IsNotEmpty({message:'Role should be array of number'})
    @IsArray({message:'Role should be number'})
    @IsInt({ each: true })

    // @IsInt({message:'Role should be number'})
    role:number;
    
    featureId: number;

}
