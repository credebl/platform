import { ApiProperty } from '@nestjs/swagger';

export class GetRemoteCredentials {

    @ApiProperty({ example: 'WgWxqztrNooG92RXvxSTWv' })
    pairwiseDid: string;

    @ApiProperty({ example: 'WgWxqztrNooG92RXvxSTWv:3:CL:20:tag' })
    credDefId: string;

    @ApiProperty()
    holderId: string;

    @ApiProperty()
    verifierId: string;
}