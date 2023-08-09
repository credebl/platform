// eslint-disable-next-line camelcase
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { UserRoleOrgPermsDto } from 'apps/api-gateway/src/dtos/user-role-org-perms.dto';

export interface IConnection {
    user: IUserRequestInterface,
    alias: string;
    label: string;
    imageUrl: string;
    multiUseInvitation: boolean;
    autoAcceptConnection: boolean;
    orgId: number;
}
export interface IUserRequestInterface {
  userId: number;
  email: string;
  orgId: number;
  agentEndPoint?: string;
  apiKey?: string;
  tenantId?: number;
  tenantName?: string;
  tenantOrgId?: number;
  userRoleOrgPermissions?: UserRoleOrgPermsDto[];
  orgName?: string;
  selectedOrg: ISelectedOrgInterface;
}

export interface ISelectedOrgInterface {
  id: number;
  userId: number;
  orgRoleId: number;
  orgId: number;
  orgRole: object;
  organisation: object;
}

export interface IOrganizationInterface {
  name: string;
  description: string;
  org_agents: IOrgAgentInterface[]
  
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
  createDateTime: string;
  lastChangedDateTime: string;
  connectionId: string;
  state: string;
  orgDid?: string;
  theirLabel: string;
  autoAcceptConnection: boolean;
  outOfBandId: string;
  orgId: number;
}

export class IFetchConnectionInterface {
  user: IUserRequest;
  outOfBandId: string;
  alias: string;
  state: string;
  myDid: string;
  theirDid: string;
  theirLabel: string;
  orgId: number;
}

export interface IFetchConnectionById {
  user: IUserRequest;
  connectionId: string;
  orgId: number;
}

export interface IFetchConnectionUrlById {
  user: IUserRequest;
  invitationId: string;
  orgId: number;
}

export interface ConnectionInvitationResponse {
  message: {
    invitation: object;
  };
}