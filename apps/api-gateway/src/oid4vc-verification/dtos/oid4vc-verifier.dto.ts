/* eslint-disable camelcase */
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ClientMetadataDto {
  @ApiProperty({
    description: 'Name of the client application or verifier',
    example: 'Credebl Verifier App'
  })
  @IsString()
  client_name: string;

  @ApiProperty({
    description: 'Logo URL of the client application',
    example: 'https://credebl.io/logo.png'
  })
  @IsString()
  logo_uri: string;
}

export class CreateVerifierDto {
  @ApiProperty({
    description: 'Unique identifier for the verifier',
    example: 'verifier-12345'
  })
  @IsString()
  verifierId: string;

  @ApiPropertyOptional({
    description: 'Optional metadata for the verifier’s client configuration',
    type: () => ClientMetadataDto,
    example: {
      client_name: 'Credebl Verifier App',
      logo_uri: 'https://credebl.io/logo.png'
    }
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ClientMetadataDto)
  clientMetadata?: ClientMetadataDto;
}
