/* eslint-disable camelcase */
import { ApiExtraModels } from '@nestjs/swagger';
// import { Role } from 'apps/platform-service/src/entities/role.entity';

@ApiExtraModels()
export class CreateUserDto {
  id?: number;
  username?: string;
  email: string;
  password: string;
  logo_uri?: string;
  token_lifetime?: number;
  is_active?: boolean;
  firstName?: string;
  lastName?: string;
  // role?: Role;
  isEmailVerified?: boolean;
  createdBy?: number;
  clientId?: string;
  clientSecret?: string;
  keycloakUserId?: string;

}
