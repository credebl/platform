import { IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { toNumber, trim } from '@credebl/common/cast.helper';

import { ApiProperty } from '@nestjs/swagger';
import { Invitation } from '@credebl/enum/enum';

export class GetAllInvitationsDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @Transform(({ value }) => toNumber(value))
    pageNumber = 1;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => String)
    @Transform(({ value }) => trim(value))
    search = '';

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @Transform(({ value }) => toNumber(value))
    pageSize = 8;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    status = Invitation.PENDING;

}
