import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional } from "class-validator";
import { SortValue } from "../../enum";

export class GetAllProofRequestsDto {
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
