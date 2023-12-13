// eslint-disable-next-line camelcase
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { organisation } from '@prisma/client';
import { UserRoleOrgPermsDto } from 'apps/api-gateway/src/dtos/user-role-org-perms.dto';

export interface IConnection {
  user: IUserRequestInterface;
  alias: string;
  label: string;
  imageUrl: string;
  multiUseInvitation: boolean;
  autoAcceptConnection: boolean;
  orgId: string;
}
export interface IUserRequestInterface {
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

export class IConnectionInterface {
  connectionDto: ConnectionPayload;
  orgId: string;
}

export class ConnectionPayload {
  createDateTime: string;
  lastChangedDateTime: string;
  id: string;
  state: string;
  orgDid?: string;
  theirLabel: string;
  autoAcceptConnection: boolean;
  outOfBandId: string;
  orgId: string;
  contextCorrelationId: string;
}

export class IFetchConnectionInterface {
  connectionSearchCriteria: IConnectionSearchCriteria;
  user: IUserRequest;
  orgId: string;
}

export interface IFetchConnectionById {
  user: IUserRequest;
  connectionId: string;
  orgId: string;
}

export interface IFetchConnectionUrlById {
  user: IUserRequest;
  invitationId: string;
  orgId: string;
}

export interface ConnectionInvitationResponse {
  message: {
    invitation: object;
  };
}

export interface OrgAgent {
  organisation: organisation;
  id: string;
  createDateTime: Date;
  createdBy: string;
  lastChangedDateTime: Date;
  lastChangedBy: string;
  orgDid: string;
  verkey: string;
  agentEndPoint: string;
  agentId: string;
  isDidPublic: boolean;
  ledgerId: string;
  orgAgentTypeId: string;
  tenantId: string;
}
export interface IConnectionSearchInterface {
  schemaSearchCriteria: IConnectionSearchCriteria,
  user: IUserRequestInterface,
  orgId: string
}
export interface IConnectionSearchCriteria {
  pageNumber: number;
  pageSize: number;
  sorting: string;
  sortByValue: string;
  searchByText: string;
  user: IUserRequestInterface
}

