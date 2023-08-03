import { ApiProperty } from '@nestjs/swagger';

export class UserCountsDto {
    @ApiProperty()
    totalUser: number;

    @ApiProperty()
    activeUser: number;
}
