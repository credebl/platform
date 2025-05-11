import { ApiProperty } from '@nestjs/swagger';

export class LabelEditorDto {
    @ApiProperty()
    labelId : number;

    @ApiProperty()
    labelName?: string;

    @ApiProperty()
    description?: string;
}