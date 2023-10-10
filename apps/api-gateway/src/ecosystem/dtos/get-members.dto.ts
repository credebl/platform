import { Transform, Type } from 'class-transformer';
import { toNumber } from '@credebl/common/cast.helper';

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class GetAllEcosystemMembersDto {

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @Transform(({ value }) => toNumber(value))
    pageNumber = 1;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @Transform(({ value }) => toNumber(value))
    pageSize = 10;


    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => String)
    search = '';

}
