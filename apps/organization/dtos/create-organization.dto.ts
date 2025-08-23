import { ApiExtraModels } from '@nestjs/swagger';
import { CredentialExchangeProtocol } from '@prisma/client';

@ApiExtraModels()
export class CreateOrganizationDto {
  name?: string;
  description?: string;
  logo?: string;
  website?: string;
  orgSlug?: string;
  createdBy?: string;
  updatedBy?: string;
  lastChangedBy?: string;
  notificationWebhook?: string;
  registrationNumber?: string;
  countryId?: number;
  cityId?: number;
  stateId?: number;
  // eslint-disable-next-line camelcase
  supported_protocol?: CredentialExchangeProtocol;
}

export class CreateUserRoleOrgDto {
  orgRoleId: string;
  userId: string;
  organisationId: string;
}
