import { ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels()
export class CreateOrganizationDto {
  name?: string;
  description?: string;
  logo?: string;
  website?: string;
}

export class CreateUserRoleOrgDto {
 orgRoleId: number;
 userId: number;
 organisationId: number;
}