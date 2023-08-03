import { ApiProperty } from '@nestjs/swagger';

export class UnauthorizedErrorDto {

    @ApiProperty({ example: 401 })
    statusCode: number;

    @ApiProperty({ example: 'Unauthorized' })
    error: string;
}
