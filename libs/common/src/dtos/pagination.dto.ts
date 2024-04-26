import { Transform, Type } from 'class-transformer';
import { toNumber } from '@credebl/common/cast.helper';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, Max, Min } from 'class-validator';

export class PaginationDto {
    @ApiProperty({ required: false, default: 1  })
    @IsOptional()
    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: 'Page number must be greater than 0' })
    pageNumber: number = 1;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => String)
    search: string = '';

    @ApiProperty({ required: false, default: 10 })
    @IsOptional()
    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: 'Page size must be greater than 0' })
    @Max(100, { message: 'Page size must be less than 100' })
    pageSize: number = 10;

}
