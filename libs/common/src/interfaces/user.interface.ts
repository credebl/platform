import { IOrgRole } from './organization.interface';

export interface ICheckUserDetails {
  isEmailVerified?: boolean;
  isFidoVerified?: boolean;
  isRegistrationCompleted?: boolean;
  userId?: number;
  message?: string;
}

export interface IUsersProfile {
  id: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  supabaseUserId?: string;
  keycloakUserId?: string;
  userOrgRoles?: IUserOrgRole[];
}

interface IUserOrgRole {
  id: string;
  userId: string;
  orgRoleId: string;
  orgId: string;
  orgRole: IOrgRole;
  organisation: IOrganisation;
}
export interface IOrganisation {
  id: string;
  name: string;
  description: string;
  orgSlug: string;
  logoUrl: string;
  website: string;
  publicProfile: boolean;
  countryId: number;
  stateId: number;
  cityId: number;
}

export interface ISignInUser {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  expires_at?: number;
  refresh_token?: string;
  isRegisteredToSupabase?: boolean;
}
export interface IVerifyUserEmail {
  email: string;
  verificationCode: string;
}
export interface ISendVerificationEmail {
  email: string;
  clientId?: string;
  clientSecret?: string;
  username?: string;
  brandLogoUrl?: string;
  platformName?: string;
}

export interface IUserInvitations {
  totalPages: number;
  userInvitationsData: IUserInvitationsData[];
}
export interface IUserInvitationsData {
  orgRoles: IOrgRole[];
  status: string;
  id: string;
  orgId: string;
  organisation: IOrganisation;
  userId: string;
}

export interface IOrganisation {
  id: string;
  name: string;
  logoUrl: string;
}

export interface IResetPasswordResponse {
  id: string;
  email: string;
}

export interface ISignUpUserResponse {
  userId: string;
}
