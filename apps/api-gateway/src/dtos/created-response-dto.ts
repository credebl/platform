import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

export class CreatedResponseDto {
    @ApiProperty({ example: 'Created' })
    message: string;

    @ApiProperty()
    success: boolean;

    @ApiProperty()
    data?: any;

    @ApiProperty({ example: HttpStatus.CREATED })
    code?: number;
}
