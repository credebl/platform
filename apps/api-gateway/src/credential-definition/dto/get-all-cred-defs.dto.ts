/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable camelcase */
import { ApiProperty } from '@nestjs/swagger';
import { SortValue } from '../../enum';
import { Transform, Type } from 'class-transformer';
import {  IsOptional, Max, Min } from 'class-validator';
import { toNumber } from '@credebl/common/cast.helper';
import { PaginationDto } from '@credebl/common/dtos/pagination.dto';

export class GetAllCredDefsDto extends PaginationDto{
   
    @ApiProperty({ required: false, example: 'id' })
  @IsOptional()
  sorting: string = 'id';

  @ApiProperty({
    enum: [SortValue.DESC, SortValue.ASC],
    required: false,
    example: SortValue.DESC,
  })
  @IsOptional()
  @IsEnum(SortValue)
  sortByValue: string = SortValue.DESC;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  revocable: boolean = true;
}

