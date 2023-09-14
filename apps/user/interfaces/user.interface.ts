

export interface UserI {
    id?: number,
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
    id: number,
    userId: number,
    orgId?: number,
    organisation?: object
    orgRoleId?: number,
    status: string,
    email?: string
    orgRoles: number[]
}

export interface UserEmailVerificationDto{
 email:string
 username?:string
}

export interface userInfo{
    password: string,
    firstName: string,
    lastName: string,
    isPasskey: boolean
}

export interface AddPasskeyDetails{
    password: string,
}

export interface UserWhereUniqueInput{
    id?: number
}

export interface UserWhereInput{
    email?: string
}
export interface UpdateUserProfile {
    id: number,
    profileImg?: string;
    firstName: string,
    lastName: string,
    isPublic: boolean,
}