import { trim } from '@credebl/common/cast.helper';
import { PaginationDto } from '@credebl/common/dtos/pagination.dto';
import { CredDefSortFields, SortValue } from '@credebl/enum/enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class GetAllPlatformCredDefsDto extends PaginationDto {

    @ApiProperty({ example: '1a7eac11-ff05-40d7-8351-4d7467687cad'})
    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID('4', { message: 'Invalid format of ledgerId' })
    ledgerId?: string;
    
    @ApiProperty({
        required: false
    })
    @Transform(({ value }) => trim(value))
    @IsOptional()
    @IsEnum(CredDefSortFields)
    sortField: string = CredDefSortFields.CREATED_DATE_TIME;

    @ApiProperty({ required: false })
    @IsOptional()
    sortBy: string = SortValue.DESC;  
    
}
