import { ApiProperty } from '@nestjs/swagger';

export class ClientLoginDto {
    @ApiProperty()
    clientId: string;

    @ApiProperty()
    clientSecret: string;

}
