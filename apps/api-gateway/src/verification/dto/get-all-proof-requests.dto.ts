import { trim } from '@credebl/common/cast.helper'
import { PaginationDto } from '@credebl/common/dtos/pagination.dto'
import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsEnum, IsOptional } from 'class-validator'
import { SortValue } from '../../enum'
import { SortFields } from '../enum/verification.enum'

export class GetAllProofRequestsDto extends PaginationDto {
  @ApiProperty({
    enum: [SortValue.DESC, SortValue.ASC],
    required: false,
  })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsEnum(SortValue)
  sortBy: string = SortValue.DESC

  @ApiProperty({
    required: false,
  })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsEnum(SortFields)
  sortField: string = SortFields.CREATED_DATE_TIME
}
