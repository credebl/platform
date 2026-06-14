/* eslint-disable camelcase */
import { ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels()
export class CreateUserDto {
  id?: string;
  username?: string;
  email: string;
  password: string;
  logo_uri?: string;
  token_lifetime?: number;
  is_active?: boolean;
  firstName?: string;
  lastName?: string;
  isEmailVerified?: boolean;
  createdBy?: string;
  clientId?: string;
  clientSecret?: string;
  supabaseUserId?: string;
  isHolder?: boolean;
}
