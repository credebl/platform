import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CredentialSendOffer {

    @ApiProperty({ example: 'string' })
    @IsNotEmpty({ message: 'Please provide valid credentialRecordId' })
    @IsString({ message: 'credentialRecordId should be string' })
    credentialRecordId: string;
}
