/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable camelcase */
import { ApiProperty } from '@nestjs/swagger';
import { SortValue } from '../../enum';
import { Type } from 'class-transformer';
import {  IsOptional } from 'class-validator';

export class GetAllCredDefsDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    pageNumber: number = 1;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => String)
    searchByText: string = '';

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
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

