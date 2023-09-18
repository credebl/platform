/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable camelcase */
import { ApiProperty } from '@nestjs/swagger';
import { SortValue } from '../../enum';
import { Transform, Type } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';
import {  IsOptional } from 'class-validator';

export class GetAllCredDefsDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @Transform(({ value }) => trim(value))
    pageNumber: number = 1;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => String)
    @Transform(({ value }) => trim(value))
    searchByText: string = '';

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @Transform(({ value }) => trim(value))
    pageSize: number = 10;

    @ApiProperty({ required: false })
    @IsOptional()
    @Transform(({ value }) => trim(value))
    sorting: string = 'id'; 

    @ApiProperty({ required: false })
    @IsOptional()
    sortByValue: string = SortValue.DESC;

    @ApiProperty({ required: false })
    @IsOptional()
    revocable: boolean = true;
}

