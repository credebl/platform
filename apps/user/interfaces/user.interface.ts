export interface UserI {
    id?: string,
    username?: string,
    email?: string,
    firstName?: string,
    lastName?: string,
    isEmailVerified?: boolean,
    clientId?: string,
    clientSecret?: string,
    supabaseUserId?: string,
    userOrgRoles?: object
}

export interface InvitationsI {
    id: string,
    userId: string,
    orgId?: string,
    organisation?: object
    orgRoleId?: string,
    status: string,
    email?: string
    orgRoles: string[]
}

export interface UserEmailVerificationDto{
 email:string
 username?:string
}

export interface userInfo{
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    isPasskey: boolean
}

export interface AddPasskeyDetails{
    password: string,
}

export interface UserWhereUniqueInput{
    id?: string
}

export interface UserWhereInput{
    email?: string
}
export interface UpdateUserProfile {
    id: string,
    profileImg?: string;
    firstName: string,
    lastName: string,
    isPublic: boolean,
}
export interface PlatformSettingsI {
    externalIp: string,
    lastInternalId: string,
    sgApiKey: string;
    emailFrom: string,
    apiEndPoint: string;
    enableEcosystem: boolean;
    multiEcosystemSupport: boolean;
}

export interface ShareUserCertificateI {
    schemaId: string;
    credentialId: string;
    attributes: Attribute[];
}

export interface Attribute {
    [key: string]: string;
    label: string
  }