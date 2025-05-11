import { ApiProperty } from '@nestjs/swagger';

export class SchemaSearchDto {
    @ApiProperty()
    // tslint:disable-next-line: variable-name
    schema_version?: string;

    @ApiProperty()
    // tslint:disable-next-line: variable-name
    schema_name?: string;

    @ApiProperty()
    attributes?: string;

    @ApiProperty()
    // tslint:disable-next-line: variable-name
    schema_ledger_id?: string;

    @ApiProperty()
    // tslint:disable-next-line: variable-name
    issuer_did?: string;

   
    // tslint:disable-next-line: variable-name
    @ApiProperty()
    search_text: string;
   
    // tslint:disable-next-line: variable-name
    @ApiProperty()
    items_per_page: number;
    
    @ApiProperty()
    page: number;

    @ApiProperty()
    filter_value : boolean;
}
