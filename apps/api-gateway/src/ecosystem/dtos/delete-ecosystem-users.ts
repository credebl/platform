import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString, IsUUID } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class DeleteEcosystemOrgDto {
  @ApiProperty({
    example: [
      '6e672a9c-64f0-4d98-b312-f578f633800b',
      '2f1a5a3c-91a2-4c4b-9f7d-1b7e6a22a111'
    ],
    isArray: true
  })
  @IsArray({ message: 'orgId must be an array' })
  @ArrayNotEmpty({ message: 'orgId cannot be empty' })
  @IsUUID('4', { each: true })
  @IsString({ each: true })
  @Transform(({ value }) => Array.isArray(value) ? value.map(v => v.trim()) : value
  )
  orgIds: string[];

  @ApiProperty({ example: '61ec22e3-9158-409d-874d-345ad2fc51e4' })
  @IsUUID()
  @IsNotEmpty({ message: 'ecosystemId is required' })
  @IsString({ message: 'ecosystemId should be a string' })
  @Transform(({ value }) => value?.trim())
  ecosystemId: string;
}
