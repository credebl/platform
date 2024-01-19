import { Transform, Type } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { SortFields } from 'apps/connection/src/enum/connection.enum';
import { SortValue } from '@credebl/enum/enum';

export class GetAllEcosystemMembersDto {
   
    @ApiProperty({ required: false, example: '1' })
    @IsOptional()
    pageNumber: number;

    @ApiProperty({ required: false, example: '10' })
    @IsOptional()
    pageSize: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @Transform(({ value }) => trim(value))
    @Type(() => String)
    search: string = '';

    @ApiProperty({
        required: false
    })
    @Transform(({ value }) => trim(value))
    @IsOptional()
    @IsEnum(SortFields)
    sortField: string = SortFields.CREATED_DATE_TIME;

    @ApiProperty({
        enum: [SortValue.DESC, SortValue.ASC],
        required: false
    })
    @Transform(({ value }) => trim(value))
    @IsOptional()
    @IsEnum(SortValue)
    sortBy: string = SortValue.DESC;

}
