import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
@ApiExtraModels()

class AttributeValue {

  @IsString()
  @IsNotEmpty({ message: 'attributeName is required.' })
  attributeName: string;

  @IsString()
  @IsNotEmpty({ message: 'schemaDataType is required.' })
  schemaDataType: string;

  @IsString()
  @IsNotEmpty({ message: 'displayName is required.' })
  displayName: string;
}

export class RequestSchemaDto {
  @ApiProperty()
  @IsString({ message: 'name must be in string format.' })
  name: string;

  @ApiProperty()
  @IsString({ message: 'version must be in string format.' })
  version: string;

  @ApiProperty({
    'example': [
      {
        attributeName: 'name',
        schemaDataType: 'string',
        displayName: 'Name'
      }
    ]
  })
  @IsArray({ message: 'attributes must be an array' })
  @IsNotEmpty({ message: 'please provide valid attributes' })
  attributes: AttributeValue[];

  @ApiProperty()
  @IsBoolean({ message: 'endorse must be a boolean.' })
  @IsOptional()
  endorse?: boolean;

}

export class RequestCredDefDto {
  @ApiProperty()
  @IsBoolean({ message: 'endorse must be a boolean.' })
  @IsOptional()
  endorse?: boolean;

  @ApiProperty()
  @IsString({ message: 'tag must be in string format.' })
  tag: string;

  @ApiProperty()
  @IsString({ message: 'schemaId must be in string format.' })
  schemaId: string;
}