import { ApiProperty } from '@nestjs/swagger';

export class NotFoundErrorDto {

    @ApiProperty({ example: 404 })
    statusCode: number;

    @ApiProperty({ example: 'Not Found' })
    error: string;

    @ApiProperty({ example: 'Not Found' })
    message: string;

    @ApiProperty()
    success: boolean;

    @ApiProperty()
    data?: boolean | {} | [];

    @ApiProperty({ example: 404 })
    code: number;
}
