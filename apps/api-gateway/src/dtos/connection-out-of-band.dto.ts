import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNotEmpty, IsObject, IsNegative } from 'class-validator';


interface attachmentsObject{
id:string,
type:string
}

export class ConnectionOutOfBandDto {

    @ApiProperty({'example':''})
    alias?:string;

    @ApiProperty({'example':'[{id:107ad6d1-5312-4b2b-bbfa-6becf6155e23,type:credential-offer}]'})
    @IsArray({message:'attachemnts must be in array'})
    @IsNotEmpty({message:'Please provide valid attachments'})
    attachments:attachmentsObject[];

    @ApiProperty({'example':'["did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/didexchange/1.0"]'})
    handshake_protocols : string[];

    @ApiProperty({'example':''})
    my_label?: string;
  
    @ApiProperty({'example': false})
    use_public_did : boolean;
}