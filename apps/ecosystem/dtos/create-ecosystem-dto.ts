import { ApiExtraModels, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { IsNotSQLInjection, trim } from '@credebl/common/cast.helper';
import { Transform, Type } from 'class-transformer';
import { PaginationDto } from '@credebl/common/dtos/pagination.dto';
import { SortValue } from '@credebl/enum/enum';

@ApiExtraModels()
export class CreateEcosystemDto {
  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'Ecosystem name is required.' })
  @MinLength(2, { message: 'Ecosystem name must be at least 2 characters.' })
  @MaxLength(50, { message: 'Ecosystem name must be at most 50 characters.' })
  @IsString({ message: 'Ecosystem name must be in string format.' })
  @IsNotSQLInjection({ message: 'Incorrect pattern for ecosystem name.' })
  name: string;

  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'Description is required.' })
  @MinLength(2, { message: 'Description must be at least 2 characters.' })
  @MaxLength(255, { message: 'Description must be at most 255 characters.' })
  @IsString({ message: 'Description must be in string format.' })
  @IsNotSQLInjection({ message: 'Incorrect pattern for description.' })
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'tag must be in string format.' })
  @Type(() => String)
  tags?: string;

  userId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'logo must be in string format.' })
  logo?: string;

  orgId?: string;
}

export enum SortFields {
  CREATED_DATE_TIME = 'createDateTime',
  NAME = 'name'
}

export class PaginationGetAllEcosystem extends PaginationDto {
  @ApiProperty({
    enum: [SortValue.DESC, SortValue.ASC],
    required: false
  })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsEnum(SortValue)
  sortBy: string = SortValue.DESC;

  @ApiProperty({
    enum: [SortFields.CREATED_DATE_TIME, SortFields.NAME],
    required: false
  })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsEnum(SortFields)
  sortField: string = SortFields.CREATED_DATE_TIME;
}
