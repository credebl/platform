import { ApiProperty } from '@nestjs/swagger';

export class PlatformConfigDto {
    @ApiProperty()
    externalIP: string;

    @ApiProperty()
    genesisURL: string;

    @ApiProperty()
    lastInternalIP: string;

    @ApiProperty()
    sgUsername: string;

    @ApiProperty()
    sgApiKey: string;

    @ApiProperty()
    sgEmailFrom: string;
}
