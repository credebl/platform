import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto {
    @ApiProperty({ example: 'Success' })
    message: string;

    @ApiProperty()
    success: boolean;

    @ApiProperty()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any;

    @ApiProperty({ example: 200 })
    code?: number;
}
