import { Transform, Type } from 'class-transformer';
import { toNumber } from '@credebl/common/cast.helper';
import { ApiProperty } from '@nestjs/swagger';
import {  IsOptional, Min } from 'class-validator';

export class PaginationDto {
    @ApiProperty({ required: false, default: 1  })
    @IsOptional()
    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: 'Page number must be greater than 0' })
    pageNumber = 1;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => String)
    search = '';

    @ApiProperty({ required: false, default: 10 })
    @IsOptional()
    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: 'Page size must be greater than 0' })
    pageSize = 10;

}
