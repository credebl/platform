import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { SortValue } from '../../enum';
import { trim } from '@credebl/common/cast.helper';
import { SortFields } from 'apps/issuance/enum/issuance.enum';

export class IGetAllIssuedCredentialsDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page Number should be a number' })
  pageNumber: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page size should be a number' })
  pageSize: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => String)
  @IsString({ message: 'Search text should be a string' })
  @Transform(({ value }) => trim(value))
  searchByText: string;

  @ApiProperty({ required: false, enum: SortFields })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsEnum(SortFields)
  sortField: string = SortFields.CREATED_DATE_TIME;

  @ApiProperty({ required: false, enum: SortValue })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsEnum(SortValue)
  sortBy: string = SortValue.DESC;
}
