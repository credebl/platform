import { ApiProperty } from '@nestjs/swagger';


export class CreateRevocationRegistryDto {
    @ApiProperty({ example: 100 })
    max_cred_num: number;

    @ApiProperty({ example: true })
    issuance_by_default: boolean;

    @ApiProperty({ example: 'WgWxqztrNooG92RXvxSTWv:3:CL:20:tag' })
    credential_definition_id: string;
}