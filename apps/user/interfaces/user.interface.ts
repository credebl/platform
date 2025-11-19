import { $Enums, Prisma, RecordType } from '@prisma/client';

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
  id:  string;
  userId:  string;
  orgRoleId:  string;
  orgId:  string;
  orgRole :IOrgRole;
  organisation:IOrganisation;
}
  export interface IOrgRole{
    id:  string;
  name: string;
  description: string;
  };
  export interface IOrganisation{
    id:  string;
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

export interface OrgInvitations {
  id: string;
  userId: string;
  orgId?: string;
  organisation?: object;
  orgRoleId?: string;
  status: string;
  email?: string;
  orgRoles: string[];
}

export interface ISendVerificationEmail {
  email: string;
  username?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface IUserInformation {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isPasskey: boolean;
  isHolder?: boolean;
}

export interface IUserInformationUsernameBased {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  isPasskey: boolean;
  isHolder?: boolean;
  clientId?: string;
  clientSecret?: string;
}

export interface AddPasskeyDetails {
  password: string;
}

export interface UpdateUserProfile {
  id: string;
  profileImg?: string;
  firstName: string;
  lastName: string;
  isPublic: boolean;
}
export interface PlatformSettings {
  externalIp: string;
  inboundEndpoint: string;
  sgApiKey: string;
  emailFrom: string;
  apiEndPoint: string;
  enableEcosystem: boolean;
  multiEcosystemSupport: boolean;
}

export interface IShareUserCertificate {
  schemaId: string;
  credDefId: string;
  credentialId: string;
  attributes: Attribute[];
  invitationUrl?: string;
}

export interface IShareDegreeCertificateRes {
  cretificate: string;
  invitationUrl?: string;
}

export interface Attribute {
  [key: string]: string;
  label: string;
}

export interface ICheckUserDetails {
  isEmailVerified?: boolean;
  isFidoVerified?: boolean;
  isRegistrationCompleted?: boolean;
}
export interface IUserCredentials {
  id: string;
  imageUrl?: string;
  credentialId?: string;
  createDateTime: Date;
  lastChangedDateTime: Date;
  deletedAt: Date;
}

export interface IOrgUsers {
    totalPages: number,
    users: OrgUser[]
}

export interface IDidList {
  id: string;
  createDateTime: Date;
  did: string;
  lastChangedDateTime: Date;
  isPrimaryDid: boolean;
}

interface OrgUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  userOrgRoles: UserOrgRoles[];
}

interface UserOrgRoles {
  id: string;
  orgId: string;
  orgRoleId: string;
  orgRole: OrgRole;
    organisation: Organization
}
interface OrgRole {
  id: string;
  name: string;
  description: string;
}

interface Organization {
    id: string,
    name: string,
    description: string,
    orgSlug: string,
    logoUrl: string,
  org_agents: OrgAgents[];
}

interface OrgAgents {
    id: string,
    orgDid: string,
    walletName: string,
    agentSpinUpStatus: number,
    agentsTypeId: string,
    createDateTime: Date,
    orgAgentTypeId:string
}

export interface Payload {
  pageNumber: number;
  pageSize: number;
  search: string;
}

export interface IVerifyUserEmail{
  email: string;
  verificationCode: string;
}

export interface  IUserSignIn{
  email: string;
  password: string;
  isPasskey: boolean;
}


export interface  IUserNameSignIn{
  username: string;
  password: string;
  isPasskey: boolean;
}

export interface IUserResetPassword{
  email: string;
  oldPassword?: string;
  newPassword?: string;
  token?: string;
  password?: string;
}
export interface IIssueCertificate {
  courseCode: string;
  courseName: string;
  theoryGradeCredits: string;
  theoryObtainedEarned: string;
  practicalGradeCredits: string;
  practicalObtainedEarned: string;
}
export  interface IPuppeteerOption{
  width: number;
  height: number;
}

export interface IUserDeletedActivity {
  id: string;
  userId: string;
  orgId: string;
  recordType: RecordType;
  txnMetadata: Prisma.JsonValue;
  deletedBy: string;
  deleteDateTime: Date;
}

export interface UserKeycloakId {
  id: string;
  keycloakUserId: string;
  email: string;
}

export interface UserRoleMapping {
  id: string;
  userId: string;
  userRoleId: string;
}

export interface UserRoleDetails{
  id: string;
  role: $Enums.UserRole;
}