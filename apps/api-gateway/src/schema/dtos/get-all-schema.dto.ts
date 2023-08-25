/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable camelcase */
import { ApiProperty } from '@nestjs/swagger';
import { SortValue } from '../../enum';
import { Transform, Type } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class GetAllSchemaDto {
    @ApiProperty({ required: false })
    @IsOptional()
    pageNumber: number = 1;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => String)
    @Transform(({ value }) => trim(value))
    searchByText: string = '';

    @ApiProperty({ required: false })
    @IsOptional()
    pageSize: number = 10;

    @ApiProperty({ required: false })
    @IsOptional()
    @Transform(({ value }) => trim(value))
    sorting: string = 'id';

    @ApiProperty({ required: false })
    @IsOptional()
    sortByValue: string = SortValue.DESC;

    @ApiProperty({ required: true })
    @Type(() => Number)
    @IsNumber()
    @IsNotEmpty()
    @IsOptional()
    orgId?: number;
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

    @ApiProperty({ required: false })
    @IsOptional()
    sorting: string = 'id';

    @ApiProperty({ required: false })
    @IsOptional()
    sortByValue: string = SortValue.DESC;

    @ApiProperty({ required: true })
    @Type(() => Number)
    @IsNumber()
    @IsNotEmpty()
    @IsOptional()
    orgId?: number;
}

export class GetAllSchemaByPlatformDto {
    @ApiProperty({ required: false })
    @IsOptional()
    pageNumber: number = 1;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => String)
    @Transform(({ value }) => trim(value))
    searchByText: string = '';

    @ApiProperty({ required: false })
    @IsOptional()
    pageSize: number = 10;

    @ApiProperty({ required: false })
    @IsOptional()
    @Transform(({ value }) => trim(value))
    sorting: string = 'id';

    @ApiProperty({ required: false })
    @IsOptional()
    sortByValue: string = SortValue.DESC;
}