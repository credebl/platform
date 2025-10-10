export interface ISignInUser {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  expires_at?: number;
  refresh_token?: string;
  isRegisteredToSupabase?: boolean;
  sessionId?: string;
  refresh_expires_in?: number;
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
  redirectTo?: string;
  clientAlias?: string;
}

export interface IClientDetailsSSO {
  alias: string;
  domain: string;
  clientId: string;
  clientSecret: string;
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
export interface IOrgRole {
  id: string;
  name: string;
  description: string;
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

export interface IClientAliases {
  id: string;
  createDateTime: string;
  lastChangedDateTime: string;
  clientAlias: string;
  clientUrl: string;
}

export interface IVerificationEmail {
  email: string;
  verificationCode: string;
  redirectUrl: string;
  clientId: string;
  brandLogoUrl: string;
  platformName: string;
  redirectTo?: string;
  clientAlias?: string;
}
