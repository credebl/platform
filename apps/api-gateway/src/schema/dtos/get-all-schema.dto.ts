/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable camelcase */
import { ApiProperty } from '@nestjs/swagger';
import { SortValue } from '../../enum';
import { Type } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class GetAllSchemaDto {
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
}

export class GetAllSchemaByPlatformDto {
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