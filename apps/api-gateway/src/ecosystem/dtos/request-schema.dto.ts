import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { trim } from '@credebl/common/cast.helper';


class AttributeValues {

  @ApiProperty()
  @IsString()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'attributeName is required' })
  attributeName: string;

  @ApiProperty()
  @IsString()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'displayName is required' })
  displayName: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty({ message: 'isRequired property is required' })
  isRequired: boolean;

  @ApiProperty()
  @IsString()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'schemaDataType is required' })
  schemaDataType: string;

}


export class RequestSchemaDto {

  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'Schema name is required' })
  @IsString({ message: 'name must be in string format.' })
  name: string;

  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'Schema version is required' })
  @IsString({ message: 'version must be in string format.' })
  version: string;

  @ApiProperty({
    type: [AttributeValues],
    'example': [
      {
        attributeName: 'name',
        schemaDataType: 'string',
        displayName: 'Name',
        isRequired: true
      }
    ]
  })
  @IsArray({ message: 'attributes must be an array' })
  @IsNotEmpty({ message: 'attributes are required' })
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AttributeValues)
  attributes: AttributeValues[];

  @ApiProperty()
  @IsBoolean({ message: 'endorse must be a boolean.' })
  @IsOptional()
  endorse?: boolean;

  userId?: string;

}

class W3CSchemaAttributesValue {

  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'title is required' })
  @IsString({ message: 'title must be in string format' })
  title: string;

  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'type is required' })
  @IsString({ message: 'type must be in string format' })
  type: string;

  @ApiProperty()
  @IsBoolean({ message: 'isRequired property must be in boolean format' })
  @IsNotEmpty({ message: 'isRequired property is required' })
  isRequired: boolean;
}

export class RequestW3CSchemaDto {

  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'schemaName is required' })
  @IsString({ message: 'schemaName must be in string format.' })
  schemaName: string;

  @ApiProperty({
    type: [W3CSchemaAttributesValue],
    'example': [
      {
        title: 'name',
        type: 'string',
        isRequired: true
      }
    ]
  })
  @IsArray({ message: 'schemaAttributes must be an array' })
  @IsNotEmpty({ message: 'schemaAttributes are required' })
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => W3CSchemaAttributesValue)
  schemaAttributes: W3CSchemaAttributesValue[];

  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'did is required' })
  @IsString({ message: 'did must be in string format.' })
  did: string;

  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'description is required' })
  @IsString({ message: 'description must be in string format.' })
  description: string;

  userId?: string;

}
export class SchemaDetails {
  @ApiProperty()
  @IsString({ message: 'name must be a string.' })
  name: string;

  @ApiProperty()
  @IsString({ message: 'version must be a string.' })
  version: string;

  @ApiProperty({
    example: ['name', 'id']
  })
  @IsArray({ message: 'attributes must be an array.' })
  @IsNotEmpty({ message: 'please provide valid attributes.' })
  attributes: string[];

}

export class RequestCredDefDto {
  @ApiProperty()
  @IsBoolean({ message: 'endorse must be a boolean.' })
  @IsOptional()
  endorse?: boolean;

  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'tag must be a string.' })
  tag: string;

  userId?: string;

  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'schemaId must be a string.' })
  schemaId: string;

  @ApiProperty()
  @ValidateNested()
  @IsOptional()
  @Type(() => SchemaDetails)
  schemaDetails?: SchemaDetails;
}