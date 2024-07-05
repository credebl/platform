import { ArrayMinSize, IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsNotSQLInjection, trim } from '@credebl/common/cast.helper';
import { JSONSchemaType, SchemaTypeEnum, W3CSchemaDataType } from '@credebl/enum/enum';

  class W3CAttributeValue {

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
class AttributeValue {

    @ApiProperty()
    @IsString()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'attributeName is required' })
    attributeName: string;

    @ApiProperty()
    @IsString()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'schemaDataType is required' })
    schemaDataType: string;

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
    @Type(() => W3CAttributeValue)
    @IsArray({ message: 'attributes must be an array' })
    @ArrayMinSize(1)
    @IsNotEmpty()
    @ArrayMinSize(1)
    @IsArray({ message: 'attributes must be an array' })
    attributes: W3CAttributeValue [];

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

    @ApiProperty({
        type: Object,
        oneOf: [
          { $ref: getSchemaPath(CreateSchemaDto) },
          { $ref: getSchemaPath(CreateW3CSchemaDto) }
        ]
      })
    @ValidateNested()
      @Type(({ object }) => {
        if (object.type === SchemaTypeEnum.INDY) {
          return CreateSchemaDto;
        } else if (object.type === SchemaTypeEnum.JSON) {
          return CreateW3CSchemaDto;
        }
      })
    schemaPayload:CreateSchemaDto | CreateW3CSchemaDto;

   
}