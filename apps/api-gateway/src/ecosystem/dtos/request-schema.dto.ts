import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { trim } from '@credebl/common/cast.helper';


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
  @IsString({ message: 'tag must be a string.' })
  tag: string;

  userId?: string;

  @ApiProperty()
  @IsString({ message: 'schemaId must be a string.' })
  schemaId: string;

  @ApiProperty()
  @ValidateNested()
  @IsOptional()
  @Type(() => SchemaDetails)
  schemaDetails?: SchemaDetails;
}