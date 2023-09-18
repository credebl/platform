import { ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels()
export class CreateOrganizationDto {
  name?: string;
  description?: string;
  logo?: string;
  website?: string;
  orgSlug?:string;
}

export class CreateUserRoleOrgDto {
 orgRoleId: number;
 userId: number;
 organisationId: number;
}