import { Transform, Type } from 'class-transformer';
// import { SortValue } from '../../enum';
import { toNumber } from '@credebl/common/cast.helper';

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class GetAllOrganizationsDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @Transform(({ value }) => toNumber(value))
    pageNumber = 1;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => String)
    search = '';

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @Transform(({ value }) => toNumber(value))
    pageSize = 10;

}
