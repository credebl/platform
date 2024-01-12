/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable camelcase */
import { ApiProperty } from '@nestjs/swagger';
import { SortValue } from '../../enum';
import { Transform, Type } from 'class-transformer';
import {  IsEnum, IsOptional } from 'class-validator';
import { trim } from '@credebl/common/cast.helper';
import { SortFields } from '../enum/cred-def.enum';

export class GetAllCredDefsDto {
    @ApiProperty({ required: false, example: '1' })
    @IsOptional()
    @Type(() => Number)
    pageNumber: number = 1;

    @ApiProperty({ required: false })
    @IsOptional()
    @Transform(({ value }) => trim(value))
    @Type(() => String)
    searchByText: string = '';

    @ApiProperty({ required: false, example: '10' })
    @IsOptional()
    @Type(() => Number)
    pageSize: number = 10;

    @ApiProperty({ required: false })
    @Transform(({ value }) => trim(value))
    @IsOptional()
    @IsEnum(SortFields)
    sortField: string = SortFields.CREATED_DATE_TIME;
    
    @ApiProperty({
        enum: [SortValue.DESC, SortValue.ASC],
        required: false
    })
    @Transform(({ value }) => trim(value))
    @IsOptional()
    @IsEnum(SortValue)
    sortBy: string = SortValue.DESC;
    
    @ApiProperty({ required: false })
    @IsOptional()
    revocable: boolean = true;
}
