import { Transform, Type } from 'class-transformer';
import { toNumber } from '@credebl/common/cast.helper';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class GetAllOrganizationsDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @Transform(({ value }) => toNumber(value))
    @IsInt({ message: 'Page number must be a positive number' })
    @Min(1, { message: 'Page number must be greater than or equal to 1' })
    pageNumber = 1;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => String)
    search = '';

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Page Size must be a positive number' })
    @Min(1, { message: 'Page Size must be greater than or equal to 1' })
    pageSize = 10;
}
