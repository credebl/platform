import { toNumber } from '@credebl/common/cast.helper'
/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable camelcase */
import { ApiProperty } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import { IsOptional, Max, Min } from 'class-validator'
import { SortValue } from '../../enum'

export class GetAllCredDefsDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  pageNumber = 1

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => String)
  searchByText = ''

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  @Min(1, { message: 'Page size must be greater than 0' })
  @Max(100, { message: 'Page size must be less than 100' })
  pageSize = 10

  @ApiProperty({ required: false })
  @IsOptional()
  sorting = 'id'

  @ApiProperty({ required: false })
  @IsOptional()
  sortByValue: string = SortValue.DESC

  @ApiProperty({ required: false })
  @IsOptional()
  revocable = true
}
