import { ApiProperty } from '@nestjs/swagger';

export class PrintableFormDto {
    @ApiProperty()
    credDefId: string;

    @ApiProperty()
    schemaId: string;

    @ApiProperty()
    theirDid: string;
}