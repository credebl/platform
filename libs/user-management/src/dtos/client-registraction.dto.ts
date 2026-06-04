/* eslint-disable camelcase */
import { ApiExtraModels } from '@nestjs/swagger';

export class accessTokenPayloadDto {
  client_id: string;
  client_secret: string;
  grant_type?: string = 'refresh_token';
  refresh_token: string;
}

export class ClientCredentialTokenPayloadDto {
  client_id: string;
  client_secret: string;
  audience?: string;
  grant_type?: string = 'client_credentials';
  scope?: string;
}

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
  // role?: Role;
  isEmailVerified?: boolean;
  createdBy?: string;
  clientId?: string;
  clientSecret?: string;
  supabaseUserId?: string;
  isHolder?: boolean;
}

export class userTokenPayloadDto {
  client_id: string;
  client_secret: string;
  username: string;
  password: string;
  grant_type?: string = 'password';
}

export class KeycloakUserRegistrationDto {
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  enabled: boolean;
  totp: boolean;
  emailVerified: boolean;
  notBefore: number;
  credentials: Credentials[];
  access: Access;
  realmRoles: string[];
  attributes: object;
}

export class Credentials {
  type: string;
  value: string;
  temporary: boolean;
}

export class Access {
  manageGroupMembership: boolean;
  view: boolean;
  mapRoles: boolean;
  impersonate: boolean;
  manage: boolean;
}
