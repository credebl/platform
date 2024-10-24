import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { SortValue } from '../../enum';
import { trim } from '@credebl/common/cast.helper';
import { SortFields } from 'apps/issuance/enum/issuance.enum';
import { PaginationDto } from '@credebl/common/dtos/pagination.dto';

export class IGetAllIssuedCredentialsDto extends PaginationDto {

  @ApiPropertyOptional({ required: false, enum: SortFields })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsEnum(SortFields)
  sortField: string = SortFields.CREATED_DATE_TIME;

  @ApiPropertyOptional({ required: false, enum: SortValue })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsEnum(SortValue)
  sortBy: string = SortValue.DESC;
}
