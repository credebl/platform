import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsOptional, Max, Min } from 'class-validator';
import { SortValue } from '../../enum';
import { toNumber, trim } from '@credebl/common/cast.helper';
import { SortFields } from '../enum/verification.enum';

export class GetAllProofRequestsDto {
    @ApiProperty({ required: false, example: '1' })
    @Transform(({ value }) => toNumber(value))
    @IsOptional()
    pageNumber: number = 1;
    
    @ApiProperty({ required: false })
    @IsOptional()
    @Transform(({ value }) => trim(value))
    @Type(() => String)
    searchByText: string = '';
    
    @ApiProperty({ required: false, example: '10' })
    @IsOptional()
    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: 'Page size must be greater than 0' })
    @Max(100, { message: 'Page size must be less than 100' })
    pageSize: number = 10;
    
    @ApiProperty({
        enum: [SortValue.DESC, SortValue.ASC],
        required: false
    })
    @Transform(({ value }) => trim(value))
    @IsOptional()
    @IsEnum(SortValue)
    sortBy: string = SortValue.DESC;
    
    @ApiProperty({
        required: false
    })
    @Transform(({ value }) => trim(value))
    @IsOptional()
    @IsEnum(SortFields)
    sortField: string = SortFields.CREATED_DATE_TIME;
    
}

