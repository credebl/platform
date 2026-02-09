import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

import { Transform } from 'class-transformer';

export class UpdateEcosystemOrgStatusDto {
  @ApiProperty({
    example: ['ef93be23-d950-497c-a886-22fcd98370fe'],
    isArray: true
  })
  @IsArray({ message: 'orgId must be an array for updating organization status' })
  @ArrayNotEmpty({ message: 'orgId cannot be empty' })
  @IsUUID('4', { each: true })
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value.map((v) => v.trim()) : value))
  orgIds: string[];

  @ApiProperty({ example: 'c78046ba-c98a-4785-80c6-06ad5167e74c' })
  @IsUUID()
  @IsNotEmpty({ message: 'ecosystemId is required to update status of an organization' })
  @IsString({ message: 'ecosystemId should be a string to update status of an organization' })
  @Transform(({ value }) => value?.trim())
  ecosystemId: string;
}

export class GetEcosystemInvitationsQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  ecosystemId?: string;
}
