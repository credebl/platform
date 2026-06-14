import { W3CSchemaDataType } from '../enum/enum';
import { UserRoleOrgPermsDto } from '../dtos/user-role.dto';

export interface ResponseType {
  statusCode: number;
  message: string;
  data?: Record<string, unknown> | string;
  error?: Record<string, unknown> | string;
}

export interface IAccessTokenData {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  scope: string;
  sessionId?: string;
}

export interface IOptionalParams {
  alias?: string;
  myDid?: string;
  outOfBandId?: string;
  state?: string;
  theirDid?: string;
  theirLabel?: string;
  threadId?: string;
  connectionId?: string;
}

export interface IFormattedResponse {
  message: string;
  data: unknown;
  success: boolean;
  code: number;
}

export interface IW3CAttributeValue {
  attributeName: string;
  schemaDataType: W3CSchemaDataType;
  displayName: string;
  isRequired: boolean;
  description?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: string[];
  contentEncoding?: string;
  contentMediaType?: string;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  items?: IW3CAttributeValue[];
  minProperties?: number;
  maxProperties?: number;
  additionalProperties?: boolean;
  required?: string[];
  dependentRequired?: Record<string, string[]>;
  properties?: Record<string, IW3CAttributeValue>;
}

export interface IPaginationSortingDto {
  pageNumber: number;
  pageSize: number;
  sortField?: string;
  sortBy?: string;
  searchByText?: string;
  search?: string;
}

export interface PaginatedResponse<T> {
  totalPages: number;
  data: T[];
}

export interface ISelectedOrgInterface {
  id: string;
  userId: string;
  orgRoleId: string;
  orgId: string;
  orgRole: object;
  organisation: object;
}

export interface IOrganizationInterface {
  name: string;
  description: string;
  org_agents: IOrgAgentInterface[];
}

export interface IOrgAgentInterface {
  orgDid: string;
  verkey: string;
  agentEndPoint: string;
  agentOptions: string;
  walletName: string;
  agentsTypeId: string;
  orgId: string;
}

export interface IUserRequestInterface {
  id?: string;
  userId: string;
  email: string;
  orgId: string;
  agentEndPoint?: string;
  apiKey?: string;
  tenantId?: string;
  tenantName?: string;
  tenantOrgId?: string;
  userRoleOrgPermissions?: UserRoleOrgPermsDto[];
  orgName?: string;
  selectedOrg: ISelectedOrgInterface;
}

export interface CommonTableColumns {
  createDateTime: Date;
  createdBy: string;
  lastChangedDateTime: Date;
  lastChangedBy: string;
}

export interface IPlatformDashboardCount {
  ecosystem: number;
  invitations: number;
  activeOrgs: number;
}
