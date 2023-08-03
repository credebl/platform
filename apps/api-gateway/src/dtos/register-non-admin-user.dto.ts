import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class RegisterNonAdminUserDto {
    @ApiProperty()
    @IsNotEmpty({message:'Please provide valid firstName'})
    @IsString({message:'FirstName should be string'})
    firstName: string;

    @ApiProperty()
    @IsNotEmpty({message:'Please provide valid lastName'})
    @IsString({message:'LastName should be string'})
    lastName: string;

    @ApiProperty()
    @IsNotEmpty({message:'Please provide valid email'})
    @IsString({message:'Email should be string'})
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
