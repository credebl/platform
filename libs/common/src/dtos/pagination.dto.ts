import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsNumber, IsOptional, Max, Min } from 'class-validator'

export class PaginationDto {
  @Type(() => Number)
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Page number must be greater than 0' })
  pageNumber = 1

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => String)
  search = ''

  @Type(() => Number)
  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Page size must be greater than 0' })
  @Max(100, { message: 'Page size must be less than 100' })
  pageSize = 10
}
