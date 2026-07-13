import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class Attribute {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  value: string;
}

@ApiExtraModels()
export class UtilitiesDto {
  @ApiProperty()
  @IsNotEmpty()
  credentialId: string;

  @ApiProperty()
  @IsNotEmpty()
  schemaId: string;

  @ApiProperty()
  @IsNotEmpty()
  credDefId: string;

  @ApiProperty()
  @IsNotEmpty()
  invitationUrl: string;

  @ApiProperty({
    example: [
      {
        name: 'name',
        value: 'value'
      }
    ]
  })
  @IsArray({ message: 'attributes must be a valid array' })
  @ArrayNotEmpty({ message: 'attributes should not be empty' })
  @ValidateNested({ each: true })
  @Type(() => Attribute)
  @IsNotEmpty({ message: 'please provide valid attributes' })
  attributes: Attribute[];
}

export class StoreObjectDto {
  @ApiProperty()
  @IsNotEmpty()
  data: string | object;
}
