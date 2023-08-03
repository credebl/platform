import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
export class FirebaseTokenDto {
    @ApiProperty()
    @IsNotEmpty({message:'Please provide valid firebaseToken'})
    @IsString({message:'FirebaseToken should be string'})
    firebaseToken: string;
}