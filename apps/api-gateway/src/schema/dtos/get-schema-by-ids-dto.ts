import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class SchemaIdsDto {
    @ApiProperty({
        description: 'Array of schema IDs',
        type: [String],
        example: ['schema1', 'schema2']
    })
    @IsArray()
    @IsNotEmpty({ message: 'Schema IDs array cannot be empty' })
    @IsString({ each: true })
    schemaIds: string[];
}