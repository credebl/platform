import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class PaginationDto {
    @Type(() => Number)
    @ApiPropertyOptional({ required: false, default: 1  })
    @IsOptional()
    @IsNumber()
    @Min(1, { message: 'Page number must be greater than 0' })
    pageNumber: number = 1;

    @ApiPropertyOptional({ required: false })
    @IsOptional()
    @Type(() => String)
    search: string = '';

    @Type(() => Number)
    @ApiPropertyOptional({ required: false, default: 10 })
    @IsOptional()
    @IsNumber()
    @Min(1, { message: 'Page size must be greater than 0' })
    @Max(100, { message: 'Page size must be less than 100' })
    pageSize: number = 10;

}