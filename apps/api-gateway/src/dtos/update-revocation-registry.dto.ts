import { ApiProperty } from '@nestjs/swagger';

export class UpdateRevocationRegistryUriDto {
    @ApiProperty({ 'example': 'WgWxqztrNooG92RXvxSTWv:4:WgWxqztrNooG92RXvxSTWv:3:CL:20:tag:CL_ACCUM:0' })
    // tslint:disable-next-line: variable-name
    revoc_reg_id?: string;
    @ApiProperty({ 'example': 'http://192.168.56.133:5000/revocation/registry/WgWxqztrNooG92RXvxSTWv:4:WgWxqztrNooG92RXvxSTWv:3:CL:20:tag:CL_ACCUM:0/tails-file' })
    // tslint:disable-next-line: variable-name
    path?: string;
}