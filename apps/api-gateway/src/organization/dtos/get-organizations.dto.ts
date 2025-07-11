import { trim } from '@credebl/common';
import { PaginationDto } from '@credebl/common';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { OrgRoles } from 'libs/org-roles/enums';

export class GetAllOrganizationsDto extends PaginationDto {
  @ApiProperty({ required: false, enum: OrgRoles })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsEnum(OrgRoles)
  role: string;
}
