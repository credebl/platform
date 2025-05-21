import { toNumber, trim } from '@credebl/common/cast.helper'
import { ApiProperty } from '@nestjs/swagger'
import { SortFields } from 'apps/connection/src/enum/connection.enum'
import { Transform, Type } from 'class-transformer'
import { IsEnum, IsOptional, Max, Min } from 'class-validator'
import { SortValue } from '../../enum'

export class GetAllConnectionsDto {
  @ApiProperty({ required: false, example: '1' })
  @Transform(({ value }) => toNumber(value))
  @IsOptional()
  pageNumber = 1

  @ApiProperty({ required: false, example: '10' })
  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  @Min(1, { message: 'Page size must be greater than 0' })
  @Max(100, { message: 'Page size must be less than 100' })
  pageSize = 10

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @Type(() => String)
  searchByText = ''

  @ApiProperty({
    required: false,
  })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsEnum(SortFields)
  sortField: string = SortFields.CREATED_DATE_TIME

  @ApiProperty({
    enum: [SortValue.DESC, SortValue.ASC],
    required: false,
  })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsEnum(SortValue)
  sortBy: string = SortValue.DESC
}

export class GetAllAgentConnectionsDto {
  @ApiProperty({ required: false, example: 'e315f30d-9beb-4068-aea4-abb5fe5eecb1' })
  @IsOptional()
  outOfBandId = ''

  @ApiProperty({ required: false, example: 'Test' })
  @IsOptional()
  alias = ''

  @ApiProperty({ required: false, example: 'did:example:e315f30d-9beb-4068-aea4-abb5fe5eecb1' })
  @IsOptional()
  myDid = ''

  @ApiProperty({ required: false, example: 'did:example:e315f30d-9beb-4068-aea4-abb5fe5eecb1' })
  @IsOptional()
  theirDid = ''

  @ApiProperty({ required: false, example: 'Bob' })
  @IsOptional()
  theirLabel = ''
}
