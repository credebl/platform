
import { Transform, Type } from 'class-transformer';
import { toNumber } from '@credebl/common/cast.helper';

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EndorserTransactionType } from '@credebl/enum/enum';

export class GetAllEndorsementsDto {
    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @Transform(({ value }) => toNumber(value))
    pageNumber = 1;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @Type(() => String)
    search = '';

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @Transform(({ value }) => toNumber(value))
    pageSize = 10;

    @ApiProperty({
        enum: [EndorserTransactionType.SCHEMA, EndorserTransactionType.CREDENTIAL_DEFINITION]
    })
    @IsOptional()
    @IsEnum(EndorserTransactionType)
    type: EndorserTransactionType.SCHEMA | EndorserTransactionType.CREDENTIAL_DEFINITION;

}
