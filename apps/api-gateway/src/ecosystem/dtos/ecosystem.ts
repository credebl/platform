import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

import { EcosystemInvitationRoles } from 'apps/ecosystem/interfaces/ecosystem.interfaces';
import { EcosystemOrgStatus } from "@credebl/enum/enum";
import { OrgRoles } from 'libs/org-roles/enums';
import { Transform } from 'class-transformer';

export class UpdateEcosystemOrgStatusDto {
  @ApiProperty({
    example: ['ef93be23-d950-497c-a886-22fcd98370fe'],
    isArray: true
  })
  @IsArray({ message: 'orgId must be an array' })
  @ArrayNotEmpty({ message: 'orgId cannot be empty' })
  @IsUUID('4', { each: true })
  @IsString({ each: true })
  @Transform(({ value }) => Array.isArray(value) ? value.map(v => v.trim()) : value
  )
  orgIds: string[];

  @ApiProperty({ example: 'c78046ba-c98a-4785-80c6-06ad5157e74c' })
  @IsUUID()
  @IsNotEmpty({ message: 'ecosystemId is required' })
  @IsString({ message: 'ecosystemId should be a string' })
  @Transform(({ value }) => value?.trim())
  ecosystemId: string;

  @ApiProperty({ enum: EcosystemOrgStatus, example: EcosystemOrgStatus.INACTIVE })
  @IsEnum(EcosystemOrgStatus, { message: `Status must be one of: ${Object.values(EcosystemOrgStatus).join(', ')}` })
  @IsNotEmpty({ message: 'Status is required' })
  status: EcosystemOrgStatus;
  
}

export enum InvitationViewRole {
  ECOSYSTEM_MEMBER = OrgRoles.ECOSYSTEM_MEMBER,
  ECOSYSTEM_LEAD = OrgRoles.ECOSYSTEM_LEAD
}

export class GetEcosystemInvitationsQueryDto {
  @IsEnum(InvitationViewRole)
  role: EcosystemInvitationRoles;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  ecosystemId?: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;
}