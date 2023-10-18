import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
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

class CredDefSchemaDetails {

  @IsString()
  @IsNotEmpty({ message: 'attributeName is required.' })
  attributeName: string;

  @IsString()
  @IsNotEmpty({ message: 'schemaDataType is required.' })
  schemaDataType: string;
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

export class SchemaDetails {
  @ApiProperty()
  @IsString({ message: 'name must be a string.' })
  name: string;

  @ApiProperty()
  @IsString({ message: 'version must be a string.' })
  version: string;

  @ApiProperty({
    example: [
      {
        attributeName: 'name',
        schemaDataType: 'string',
        displayName: 'Name'
      }
    ]
  })
  @IsArray({ message: 'attributes must be an array.' })
  @IsNotEmpty({ message: 'please provide valid attributes.' })
  @ValidateNested({ each: true })
  @Type(() => CredDefSchemaDetails)
  attributes: CredDefSchemaDetails[];

}

export class RequestCredDefDto {
  @ApiProperty()
  @IsBoolean({ message: 'endorse must be a boolean.' })
  @IsOptional()
  endorse?: boolean;

  @ApiProperty()
  @IsString({ message: 'tag must be a string.' })
  tag: string;

  @ApiProperty()
  @IsString({ message: 'schemaId must be a string.' })
  schemaId: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => SchemaDetails)
  schemaDetails: SchemaDetails;
}