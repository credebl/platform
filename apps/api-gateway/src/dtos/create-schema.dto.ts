import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateIf,
  ValidateNested
} from 'class-validator';
import { IndySchemaDataType, JSONSchemaType, SchemaTypeEnum, W3CSchemaDataType } from '@credebl/enum/enum';
import { IsNotSQLInjection, ValidateNestedStructureFields, trim } from '@credebl/common/cast.helper';
import { Transform, Type, plainToClass } from 'class-transformer';

export class W3CAttributeValue {
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

  @ApiProperty({
    description: 'The type of the schema',
    enum: W3CSchemaDataType,
    example: W3CSchemaDataType.STRING
  })
  @IsEnum(W3CSchemaDataType, {
    message: `Schema data type must be one of [${Object.values(W3CSchemaDataType).join(', ')}]`
  })
  @ValidateNestedStructureFields()
  schemaDataType: W3CSchemaDataType;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty({ message: 'isRequired property is required' })
  isRequired: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Minimum length for string values' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @ValidateIf((o) => o.schemaDataType === W3CSchemaDataType.STRING)
  minLength?: number;

  @ApiPropertyOptional({ description: 'Maximum length for string values' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @ValidateIf((o) => o.schemaDataType === W3CSchemaDataType.STRING)
  maxLength?: number;

  @ApiPropertyOptional({ description: 'Regular expression pattern for string values' })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.schemaDataType === W3CSchemaDataType.STRING)
  pattern?: string;

  @ApiPropertyOptional({ description: 'Enumerated values for string type' })
  @IsOptional()
  @IsArray()
  @ValidateIf((o) => o.schemaDataType === W3CSchemaDataType.STRING)
  enum?: string[];

  @ApiPropertyOptional({ description: 'Content encoding (e.g., base64)' })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.schemaDataType === W3CSchemaDataType.STRING)
  contentEncoding?: string;

  @ApiPropertyOptional({ description: 'Content media type (e.g., image/png)' })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.schemaDataType === W3CSchemaDataType.STRING)
  contentMediaType?: string;

  // Number type specific validations
  @ApiPropertyOptional({ description: 'Minimum value (inclusive) for number values' })
  @IsOptional()
  @IsNumber()
  @ValidateIf((o) => o.schemaDataType === W3CSchemaDataType.NUMBER)
  minimum?: number;

  @ApiPropertyOptional({ description: 'Maximum value (inclusive) for number values' })
  @IsOptional()
  @IsNumber()
  @ValidateIf((o) => o.schemaDataType === W3CSchemaDataType.NUMBER)
  maximum?: number;

  @ApiPropertyOptional({ description: 'Minimum value (exclusive) for number values' })
  @IsOptional()
  @IsNumber()
  @ValidateIf((o) => o.schemaDataType === W3CSchemaDataType.NUMBER)
  exclusiveMinimum?: number;

  @ApiPropertyOptional({ description: 'Maximum value (exclusive) for number values' })
  @IsOptional()
  @IsNumber()
  @ValidateIf((o) => o.schemaDataType === W3CSchemaDataType.NUMBER)
  exclusiveMaximum?: number;

  @ApiPropertyOptional({ description: 'Number must be a multiple of this value' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @ValidateIf((o) => o.schemaDataType === W3CSchemaDataType.NUMBER)
  multipleOf?: number;

  // Array type specific validations
  @ApiPropertyOptional({ description: 'Minimum number of items in array' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @ValidateIf((o) => o.schemaDataType === W3CSchemaDataType.ARRAY)
  minItems?: number;

  @ApiPropertyOptional({ description: 'Maximum number of items in array' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @ValidateIf((o) => o.schemaDataType === W3CSchemaDataType.ARRAY)
  maxItems?: number;

  @ApiPropertyOptional({ description: 'Whether array items must be unique' })
  @IsOptional()
  @IsBoolean()
  @ValidateIf((o) => o.schemaDataType === W3CSchemaDataType.ARRAY)
  uniqueItems?: boolean;

  @ApiPropertyOptional({ description: 'Array of items', type: [W3CAttributeValue] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => W3CAttributeValue)
  @ValidateIf((o) => o.schemaDataType === W3CSchemaDataType.ARRAY)
  items?: W3CAttributeValue[];

  // Object type specific validations
  @ApiPropertyOptional({ description: 'Minimum number of properties in object' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @ValidateIf((o) => o.schemaDataType === W3CSchemaDataType.OBJECT)
  minProperties?: number;

  @ApiPropertyOptional({ description: 'Maximum number of properties in object' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @ValidateIf((o) => o.schemaDataType === W3CSchemaDataType.OBJECT)
  maxProperties?: number;

  @ApiPropertyOptional({ description: 'additional properties must be boolean' })
  @IsOptional()
  @IsBoolean()
  @ValidateIf((o) => o.schemaDataType === W3CSchemaDataType.OBJECT)
  additionalProperties?: boolean;

  @ApiPropertyOptional({ description: 'Required properties for object type' })
  @IsOptional()
  @IsArray()
  @ValidateIf((o) => o.schemaDataType === W3CSchemaDataType.OBJECT)
  required?: string[];

  @ApiPropertyOptional({ description: 'Dependent required properties' })
  @IsOptional()
  @ValidateIf((o) => o.schemaDataType === W3CSchemaDataType.OBJECT)
  dependentRequired?: Record<string, string[]>;

  @ApiPropertyOptional({ description: 'Object with dynamic properties' })
  @IsOptional()
  @ValidateIf((o) => o.schemaDataType === W3CSchemaDataType.OBJECT)
  @Transform(({ value }) => {
    if (value && 'object' === typeof value) {
      const result = {};
      Object.entries(value).forEach(([key, propValue]) => {
        result[key] = plainToClass(W3CAttributeValue, propValue, {
          enableImplicitConversion: false
        });
      });
      return result;
    }
    return value;
  })
  properties?: Record<string, W3CAttributeValue>;
}

class AttributeValue {
  @ApiProperty()
  @IsString()
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'attributeName is required' })
  attributeName: string;

  @ApiProperty({
    description: 'The type of the schema',
    enum: IndySchemaDataType,
    example: IndySchemaDataType.STRING
  })
  @IsString()
  @Transform(({ value }) => trim(value))
  @IsEnum(IndySchemaDataType, {
    message: `Schema data type must be one of [${Object.values(IndySchemaDataType).join(', ')}]`
  })
  schemaDataType: IndySchemaDataType;

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

export class CreateSchemaDto {
  @ApiProperty()
  @IsString({ message: 'schemaVersion must be a string' })
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'schemaVersion is required' })
  schemaVersion: string;

  @ApiProperty()
  @IsString({ message: 'schemaName must be a string' })
  @Transform(({ value }) => trim(value))
  @IsNotEmpty({ message: 'schemaName is required' })
  @IsNotSQLInjection({ message: 'SchemaName is required.' })
  schemaName: string;

  @ApiProperty({
    type: [AttributeValue],
    example: [
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
  @Type(() => AttributeValue)
  attributes: AttributeValue[];

  orgId: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsNotEmpty({ message: 'orgDid should not be empty' })
  @IsString({ message: 'orgDid must be a string' })
  orgDid: string;
}

export class CreateW3CSchemaDto {
  @ApiProperty({
    type: [W3CAttributeValue],
    example: [
      {
        attributeName: 'name',
        schemaDataType: 'string',
        displayName: 'Name',
        isRequired: true
      }
    ]
  })
  @ValidateNested({ each: true })
  @Type(() => W3CAttributeValue)
  @IsArray({ message: 'attributes must be an array' })
  @ArrayMinSize(1)
  @IsNotEmpty()
  attributes: W3CAttributeValue[];

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
    description: 'The type of the schema',
    enum: JSONSchemaType,
    example: JSONSchemaType.POLYGON_W3C
  })
  @IsEnum(JSONSchemaType, { message: 'Schema type must be a valid schema type' })
  @IsNotEmpty({ message: 'Type is required' })
  schemaType: JSONSchemaType;
}

@ApiExtraModels(CreateSchemaDto, CreateW3CSchemaDto)
export class GenericSchemaDTO {
  @ApiProperty({
    description: 'The type of the schema',
    enum: SchemaTypeEnum,
    example: SchemaTypeEnum.INDY
  })
  @IsEnum(SchemaTypeEnum, { message: 'Type must be a valid schema type' })
  @IsNotEmpty({ message: 'Type is required' })
  type: SchemaTypeEnum;

  @ApiPropertyOptional()
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsString({ message: 'alias must be a string' })
  @IsNotEmpty({ message: 'alias is required' })
  alias: string;

  @ApiProperty({
    type: Object,
    oneOf: [{ $ref: getSchemaPath(CreateSchemaDto) }, { $ref: getSchemaPath(CreateW3CSchemaDto) }]
  })
  @ValidateNested()
  @Type(({ object }) => {
    if (object.type === SchemaTypeEnum.INDY) {
      return CreateSchemaDto;
    } else if (object.type === SchemaTypeEnum.JSON) {
      return CreateW3CSchemaDto;
    }
  })
  schemaPayload: CreateSchemaDto | CreateW3CSchemaDto;
}
