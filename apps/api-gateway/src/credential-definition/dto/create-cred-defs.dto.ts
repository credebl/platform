import { IsBoolean, IsDefined, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';

export class CreateCredentialDefinitionDto {

    @ApiProperty({ 'example': 'default' })
    @IsDefined({ message: 'Tag is required' })
    @IsNotEmpty({ message: 'Please provide a tag' })
    @IsString({ message: 'Tag should be string' })
    tag: string;

    @ApiProperty({ 'example': 'WgWxqztrNooG92RXvxSTWv:2:schema_name:1.0' })
    @IsDefined({ message: 'schemaLedgerId is required' })
    @IsNotEmpty({ message: 'Please provide valid schema ledger Id' })
    @Transform(({ value }) => trim(value))
    @IsString({ message: 'Schema id should be string' })
    schemaLedgerId: string;

    orgId: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'orgDid must be a string' })
    orgDid: string;

    @ApiProperty({ default: false })
    @IsDefined({ message: 'Revocable is required.' })
    @IsBoolean({ message: 'Revocable must be a boolean value.' })
    @IsNotEmpty({ message: 'Please provide whether the revocable must be true or false' })
    revocable: boolean;
}
