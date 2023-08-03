import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
export class RemoveHolderDto {
    @ApiProperty()
    @IsNotEmpty({message:'Please provide valid username'})
    @IsString({message:'Username should be string'})
    username: string;

    @ApiProperty()
    @IsNotEmpty({message:'Please provide valid password'})
    @IsString({message:'Password should be string'})
    password: string;
}
