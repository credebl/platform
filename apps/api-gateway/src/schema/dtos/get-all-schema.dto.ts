/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable camelcase */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SortValue } from '../../enum';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsOptional, IsUUID, Min } from 'class-validator';
import { toNumber, trim } from '@credebl/common/cast.helper';
import { CredDefSortFields, SortFields } from 'apps/ledger/src/schema/enum/schema.enum';

export class GetAllSchemaDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @Transform(({ value }) => trim(value))
    @Type(() => String)
    searchByText: string = '';

    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: 'Page number must be greater than 0' })
    pageNumber: number = 1;

    @ApiProperty({ required: false, default: 10 })
    @IsOptional()
    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: 'Page size must be greater than 0' })
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

    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: 'Page number must be greater than 0' })
    pageNumber: number = 1;

    @ApiProperty({ required: false, default: 10 })
    @IsOptional()
    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: 'Page size must be greater than 0' })
    pageSize: number = 10;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => String)
    searchByText: string = '';

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

    @ApiProperty({ example: '1a7eac11-ff05-40d7-8351-4d7467687cad'})
    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID('4', { message: 'Invalid format of ledgerId' })
    ledgerId?: string;
    
    @ApiProperty({ required: false, default: 1  })
    @IsOptional()
    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: 'Page number must be greater than 0' })
    pageNumber: number = 1;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => String)
    searchByText: string = '';

    @ApiProperty({ required: false, default: 10  })
    @IsOptional()
    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: 'Page size must be greater than 0' })
    pageSize: number = 10;

    @ApiProperty({
        required: false
    })
    @Transform(({ value }) => trim(value))
    @IsOptional()
    @IsEnum(SortFields)
    sorting: string = SortFields.CREATED_DATE_TIME;

    @ApiProperty({ required: false })
    @IsOptional()
    sortByValue: string = SortValue.DESC;
    
}