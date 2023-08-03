import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionDto {

    @ApiProperty()
    name: string;

    @ApiProperty()
    description: string;
}
