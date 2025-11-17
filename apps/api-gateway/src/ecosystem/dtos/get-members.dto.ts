import { Transform } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { SortMembers, SortValue } from '@credebl/enum/enum';
import { PaginationDto } from '@credebl/common/dtos/pagination.dto';

export class GetAllEcosystemMembersDto extends PaginationDto {
    @ApiProperty({
        enum: [SortMembers.CREATED_DATE_TIME, SortMembers.ID, SortMembers.ORGANIZATION, SortMembers.STATUS],
        required: false
    })
    @Transform(({ value }) => trim(value))
    @IsOptional()
    @IsEnum(SortMembers)
    sortField: string = SortMembers.CREATED_DATE_TIME;

    @ApiProperty({
        enum: [SortValue.DESC, SortValue.ASC],
        required: false
    })
    @Transform(({ value }) => trim(value))
    @IsOptional()
    @IsEnum(SortValue)
    sortBy: string = SortValue.DESC;
}
