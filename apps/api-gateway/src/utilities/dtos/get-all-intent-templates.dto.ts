import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { toNumber, trim } from '@credebl/common/cast.helper';
import { SortValue } from '../../enum';

export class GetAllIntentTemplatesDto {
  @ApiProperty({ required: false, example: '1' })
  @Transform(({ value }) => toNumber(value))
  @IsOptional()
  pageNumber: number = 1;

  @ApiProperty({ required: false, example: '10' })
  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  @Min(1, { message: 'Page size must be greater than 0' })
  @Max(100, { message: 'Page size must be less than 100' })
  pageSize: number = 10;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @Type(() => String)
  searchByText: string = '';

  @ApiProperty({ required: false })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  sortField: string = 'createDateTime';

  @ApiProperty({ enum: [SortValue.DESC, SortValue.ASC], required: false })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsEnum(SortValue)
  sortBy: string = SortValue.DESC;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  intent?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  intentId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  assignedToOrgId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  templateCreatedByOrgId?: string;
}
