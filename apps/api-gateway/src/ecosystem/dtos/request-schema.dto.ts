import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { trim } from '@credebl/common/cast.helper';
import { JSONSchemaType, SchemaTypeEnum, W3CSchemaDataType } from '@credebl/enum/enum';


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

export class RequestIndySchemaDto {

  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'Schema name is required' })
  @IsString({ message: 'name must be in string format.' })
  schemaName: string;

  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'Schema version is required' })
  @IsString({ message: 'version must be in string format.' })
  schemaVersion: string;

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
}

class W3CSchemaAttributesValue {

  @ApiProperty()
  @IsString()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'attributeName is required' })
  attributeName: string;

  @ApiProperty({
      description: 'The type of the schema',
      enum: W3CSchemaDataType,
      example: W3CSchemaDataType.STRING 
    })
  @IsEnum(W3CSchemaDataType, { message: 'Schema data type must be a valid type' })
  schemaDataType: W3CSchemaDataType;

  @ApiProperty()
  @IsString()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'displayName is required' })
  displayName: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty({ message: 'isRequired property is required' })
  isRequired: boolean;
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

export class RequestW3CSchemaDto {

  @ApiProperty()
  @IsString({ message: 'schemaName must be a string' })
  @Transform(({ value }) => value.trim())
  @IsNotEmpty({ message: 'schemaName is required' })
  schemaName: string;

  @ApiProperty()
  @IsString({ message: 'description must be a string' })
  @IsNotEmpty({ message: 'description is required' })
  description: string;

  @ApiProperty({
      type: [W3CSchemaAttributesValue],
      'example': [
          {
              attributeName: 'name',
              schemaDataType: 'string',
              displayName: 'Name',
              isRequired: true
          }
      ]
  })
  @ValidateNested({each: true})
  @Type(() => W3CSchemaAttributesValue)
  @IsNotEmpty()
  attributes: W3CSchemaAttributesValue [];

  @ApiProperty({
    description: 'The type of the schema',
    enum: JSONSchemaType,
    example: JSONSchemaType.POLYGON_W3C 
  })
  @IsEnum(JSONSchemaType, { message: 'Schema type must be a valid schema type' })
  @IsNotEmpty({ message: 'Type is required' })
  schemaType: JSONSchemaType;
}

@ApiExtraModels(RequestIndySchemaDto, RequestW3CSchemaDto)
export class RequestSchemaDto {

  @ApiProperty()
  @IsBoolean({ message: 'endorse property must be a boolean.' })
  @IsNotEmpty({ message: 'endorse property is required' })
  endorse?: boolean;

  @ApiProperty({
    description: 'The type of the schema',
    enum: SchemaTypeEnum,
    example: SchemaTypeEnum.INDY
  })
  @IsEnum(SchemaTypeEnum, { message: 'Type must be a valid schema type' })
  @IsNotEmpty({ message: 'Type is required' })
  type: SchemaTypeEnum;
  
  @ApiProperty({
    type: Object,
    oneOf: [{ $ref: getSchemaPath(RequestIndySchemaDto) }, { $ref: getSchemaPath(RequestW3CSchemaDto) }]
  })
  @ValidateNested()
  @Type(({ object }) => {
    if (object.type === SchemaTypeEnum.INDY) {
      return RequestIndySchemaDto;
    } else if (object.type === SchemaTypeEnum.JSON) {
      return RequestW3CSchemaDto;
    }
  })
  schemaPayload: RequestIndySchemaDto | RequestW3CSchemaDto;
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