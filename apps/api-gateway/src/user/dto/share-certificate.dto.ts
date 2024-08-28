import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';

interface Attribute {
  name: string;
  value: string;
}
export class CreateCertificateDto {

  @ApiProperty()
  @IsNotEmpty({ message: 'Please provide valid credentialId' })
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'credentialId should be string' })
  credentialId: string;

  @ApiProperty({ example: 'schemaId' })
  @IsNotEmpty({ message: 'Please provide valid schemaId' })
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'schemaId should be string' })
  schemaId: string;

  @ApiProperty({
    example: [
      {
        name: 'name',
        value: 'value'
      }
    ]
  })
  @IsArray({ message: 'attributes must be a valid array' })
  @IsNotEmpty({ message: 'please provide valid attributes' })
  attributes: Attribute[];
}
