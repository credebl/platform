import { IsBoolean, IsDefined, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreateCredentialDefinitionDto {

    @ApiProperty({ 'example': 'default' })
    @IsNotEmpty({ message: 'Please provide a tag' })
    @IsString({ message: 'Tag id should be string' })
    tag: string;

    @ApiProperty({ 'example': 'WgWxqztrNooG92RXvxSTWv:2:schema_name:1.0' })
    @IsNotEmpty({ message: 'Please provide a schema id' })
    @IsString({ message: 'Schema id should be string' })
    schemaLedgerId: string;

    @ApiProperty()
    
    @IsNotEmpty({ message: 'Please provide orgId' })
    orgId: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString({ message: 'orgDid must be a string' })
    orgDid: string;

    @ApiProperty({ default: true })
    @IsDefined({ message: 'Revocable is required.' })
    @IsBoolean({ message: 'Revocable must be a boolean value.' })
    @IsNotEmpty({ message: 'Please provide whether the revocable must be true or false' })
    revocable = true;
}
