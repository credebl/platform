/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable camelcase */
import { ApiProperty } from '@nestjs/swagger';
import { SortValue } from '../../enum';
import { Transform, Type } from 'class-transformer';
import {  IsOptional, Max, Min } from 'class-validator';
import { toNumber } from '@credebl/common/cast.helper';

export class GetAllCredDefsDto {
    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    @Transform(({ value }) => toNumber(value))
    pageNumber: number = 1;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => String)
    searchByText: string = '';

    @ApiProperty({ required: false, default: 10 })
    @IsOptional()
    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: 'Page size must be greater than 0' })
    @Max(100, { message: 'Page size must be less than 100' })
    pageSize: number = 10;

    @ApiProperty({ required: false })
    @IsOptional()
    sorting: string = 'id'; 

    @ApiProperty({ required: false })
    @IsOptional()
    sortByValue: string = SortValue.DESC;

    @ApiProperty({ required: false })
    @IsOptional()
    revocable: boolean = true;
}

