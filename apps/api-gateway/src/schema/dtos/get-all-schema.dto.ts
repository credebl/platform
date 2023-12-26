/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable camelcase */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SortValue } from '../../enum';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { trim } from '@credebl/common/cast.helper';
import { CredDefSortFields, SortFields } from 'apps/ledger/src/schema/enum/schema.enum';

export class GetAllSchemaDto {
    @ApiProperty({ required: false })
    @IsOptional()
    pageNumber: number = 1;

    @ApiProperty({ required: false })
    @IsOptional()
    @Transform(({ value }) => trim(value))
    @Type(() => String)
    searchByText: string = '';

    @ApiProperty({ required: false })
    @IsOptional()
    pageSize: number = 10;

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

export class GetCredentialDefinitionBySchemaIdDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    pageNumber: number = 1;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    pageSize: number = 10;

    @ApiProperty({
        required: false
    })
    @Transform(({ value }) => trim(value))
    @IsOptional()
    @IsEnum(CredDefSortFields)
    sortField: string = SortFields.CREATED_DATE_TIME;

    @ApiProperty({
        enum: [SortValue.DESC, SortValue.ASC],
        required: false
    })
    @Transform(({ value }) => trim(value))
    @IsOptional()
    @IsEnum(SortValue)
    sortBy: string = SortValue.DESC;

    schemaId: string;

    orgId: string;
}

export class GetAllSchemaByPlatformDto {

    @ApiProperty()
    @ApiPropertyOptional()
    @IsOptional()
    ledgerId?: string;
    
    @ApiProperty({ required: false })
    @IsOptional()
    pageNumber: number = 1;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => String)
    searchByText: string = '';

    @ApiProperty({ required: false })
    @IsOptional()
    pageSize: number = 10;

    @ApiProperty({ required: false })
    @IsOptional()
    sorting: string = 'id';

    @ApiProperty({ required: false })
    @IsOptional()
    sortByValue: string = SortValue.DESC;
}