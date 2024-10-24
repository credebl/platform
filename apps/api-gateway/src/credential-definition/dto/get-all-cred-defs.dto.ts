/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable camelcase */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SortValue } from '../../enum';
import { Transform, Type } from 'class-transformer';
import {  IsOptional, Max, Min } from 'class-validator';
import { toNumber } from '@credebl/common/cast.helper';

export class GetAllCredDefsDto {
    @ApiPropertyOptional({ required: false, default: 1 })
    @IsOptional()
    @Transform(({ value }) => toNumber(value))
    pageNumber: number = 1;

    @ApiPropertyOptional({ required: false })
    @IsOptional()
    @Type(() => String)
    searchByText: string = '';

    @ApiPropertyOptional({ required: false, default: 10 })
    @IsOptional()
    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: 'Page size must be greater than 0' })
    @Max(100, { message: 'Page size must be less than 100' })
    pageSize: number = 10;

    @ApiPropertyOptional({ required: false })
    @IsOptional()
    sorting: string = 'id'; 

    @ApiPropertyOptional({ required: false })
    @IsOptional()
    sortByValue: string = SortValue.DESC;

    @ApiPropertyOptional({ required: false })
    @IsOptional()
    revocable: boolean = true;
}

