import { ApiProperty } from '@nestjs/swagger';

export class InternalServerErrorDto {

    @ApiProperty({ example: 500 })
    statusCode: number;

    @ApiProperty({ example: 'Internal server error' })
    error: string;
}
