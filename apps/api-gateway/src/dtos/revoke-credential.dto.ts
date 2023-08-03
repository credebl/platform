import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsNumber } from 'class-validator';
export class RevokeCredentialDto {

    @ApiProperty({ example: 1 })
    @IsNotEmpty({message:'Please provide valid cred-rev-id'})
    @IsNumber()
    cred_rev_id: number;

    @ApiProperty({ example: true })
    @IsNotEmpty({message:'Please provide valid publish'})
    @IsBoolean({message:'Publish should be boolean'})
    publish?: boolean;

    @ApiProperty({ example: 'Th7MpTaRZVRYnPiabds81Y:4:Th7MpTaRZVRYnPiabds81Y:3:CL:185:aadhar1:CL_ACCUM:0296a307-9127-481f-ba4f-c43f89f1420e' })
    @IsNotEmpty({message:'Please provide valid rev-reg-id'})
    @IsString({message:'Rev-reg-id should be string'})
    rev_reg_id: string;

    @ApiProperty()
    @IsNotEmpty({message:'Please provide valid cred-ex-id'})
    @IsString({message:'Cred-ex-id should be string'})
    cred_ex_id?: string;

    @ApiProperty()
    @IsNotEmpty({message:'Please provide valid email'})
    @IsString({message:'Email should be string'})
    email: string;

    @ApiProperty()
    @IsNotEmpty({message:'Please provide valid password'})
    @IsString({message:'Password should be string'})
    password: string;

    featureId: number;
}