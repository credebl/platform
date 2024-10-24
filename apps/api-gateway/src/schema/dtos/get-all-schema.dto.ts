/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable camelcase */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsOptional, IsUUID, Min } from 'class-validator';
import { toNumber, trim } from '@credebl/common/cast.helper';
import { CredDefSortFields, SchemaType, SortFields, SortValue } from '@credebl/enum/enum';

export class GetAllSchemaDto {
    @ApiPropertyOptional({ required: false })
    @IsOptional()
    @Transform(({ value }) => trim(value))
    @Type(() => String)
    searchByText: string = '';

    @ApiPropertyOptional({ required: false, default: 1 })
    @IsOptional()
    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: 'Page number must be greater than 0' })
    pageNumber: number = 1;

    @ApiPropertyOptional({ required: false, default: 10 })
    @IsOptional()
    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: 'Page size must be greater than 0' })
    pageSize: number = 10;
    
    @ApiPropertyOptional({
        required: false
    })
    @Transform(({ value }) => trim(value))
    @IsOptional()
    @IsEnum(SortFields)
    sortField: string = SortFields.CREATED_DATE_TIME;

    @ApiPropertyOptional({
        enum: [SortValue.DESC, SortValue.ASC],
        required: false
    })
    @Transform(({ value }) => trim(value))
    @IsOptional()
    @IsEnum(SortValue)
    sortBy: string = SortValue.DESC;
}

export class GetCredentialDefinitionBySchemaIdDto {

    @ApiPropertyOptional({ required: false, default: 1 })
    @IsOptional()
    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: 'Page number must be greater than 0' })
    pageNumber: number = 1;

    @ApiPropertyOptional({ required: false, default: 10 })
    @IsOptional()
    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: 'Page size must be greater than 0' })
    pageSize: number = 10;

    @ApiPropertyOptional({ required: false })
    @IsOptional()
    @Type(() => String)
    searchByText: string = '';

    @ApiPropertyOptional({
        required: false
    })
    @Transform(({ value }) => trim(value))
    @IsOptional()
    @IsEnum(CredDefSortFields)
    sortField: string = SortFields.CREATED_DATE_TIME;

    @ApiPropertyOptional({
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

    @ApiPropertyOptional({ example: '1a7eac11-ff05-40d7-8351-4d7467687cad'})
    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID('4', { message: 'Invalid format of ledgerId' })
    ledgerId?: string;
    
    @ApiPropertyOptional({ required: false, default: 1  })
    @IsOptional()
    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: 'Page number must be greater than 0' })
    pageNumber: number = 1;

    @ApiPropertyOptional({ required: false })
    @IsOptional()
    @Type(() => String)
    searchByText: string = '';

    @ApiPropertyOptional({ required: false, default: 10  })
    @IsOptional()
    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: 'Page size must be greater than 0' })
    pageSize: number = 10;

    @ApiPropertyOptional({
        required: false
    })
    @Transform(({ value }) => trim(value))
    @IsOptional()
    @IsEnum(SortFields)
    sorting: string = SortFields.CREATED_DATE_TIME;

    @ApiPropertyOptional({ required: false })
    @IsOptional()
    sortByValue: string = SortValue.DESC;

    @ApiPropertyOptional({
        type: SchemaType,
        required: false
    })
    @Transform(({ value }) => trim(value))
    @IsOptional()
    @IsEnum(SchemaType)
    schemaType: SchemaType;
    
}