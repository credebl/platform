import { ApiProperty } from '@nestjs/swagger';

export class ForbiddenErrorDto {

    @ApiProperty({ example: 403 })
    statusCode: number;

    @ApiProperty({ example: 'Forbidden' })
    error: string;
}
