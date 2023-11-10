import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

interface Attribute {
  name: string;
  value: string;
}
export class CreateUserCertificateDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Please provide valid schemaId' })
  @IsString({ message: 'credentialId should be string' })
  credentialId: string;

  @ApiProperty({ example: 'SchemaId' })
  @IsNotEmpty({ message: 'Please provide valid schemaId' })
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
