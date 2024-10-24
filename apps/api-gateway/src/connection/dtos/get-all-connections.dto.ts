import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsOptional, Max, Min } from 'class-validator';
import { SortValue } from '../../enum';
import { toNumber, trim } from '@credebl/common/cast.helper';
import { SortFields } from 'apps/connection/src/enum/connection.enum';

export class GetAllConnectionsDto {
  @ApiPropertyOptional({ required: false, example: '1' })
  @Transform(({ value }) => toNumber(value))
  @IsOptional()
  pageNumber: number = 1;

  @ApiPropertyOptional({ required: false, example: '10' })
  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  @Min(1, { message: 'Page size must be greater than 0' })
  @Max(100, { message: 'Page size must be less than 100' })
  pageSize: number = 10;

  @ApiPropertyOptional({ required: false })
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @Type(() => String)
  searchByText: string = '';

  @ApiPropertyOptional({
    required: false
  })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsEnum(SortFields)
  sortField: string = SortFields.CREATED_DATE_TIME;

  @ApiPropertyOptional({
    enum: [SortValue.DESC, SortValue.ASC],
    required: false
  })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsEnum(SortValue)
  sortBy: string = SortValue.DESC;
}

export class GetAllAgentConnectionsDto {
  @ApiPropertyOptional({ required: false, example: 'e315f30d-9beb-4068-aea4-abb5fe5eecb1' })
  @IsOptional()
  outOfBandId: string = '';

  @ApiPropertyOptional({ required: false, example: 'Test' })
  @IsOptional()
  alias: string = '';

  @ApiPropertyOptional({ required: false, example: 'did:example:e315f30d-9beb-4068-aea4-abb5fe5eecb1' })
  @IsOptional()
  myDid: string = '';

  @ApiPropertyOptional({ required: false, example: 'did:example:e315f30d-9beb-4068-aea4-abb5fe5eecb1' })
  @IsOptional()
  theirDid: string = '';

  @ApiPropertyOptional({ required: false, example: 'Bob' })
  @IsOptional()
  theirLabel: string = '';
}
