import { UserRoleOrgPermsDto } from '../../dtos/user-role-org-perms.dto';

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
  tag: object;
  createdAt: string;
  updatedAt: string;
  connectionId: string;
  state: string;
  orgDid: string;
  theirLabel: string;
  autoAcceptConnection: boolean;
  outOfBandId: string;
  orgId: string;
}

interface Tags {
  invitationId: string;
  recipientKeyFingerprints: string[];
  role: string;
  state: string;
  threadId: string;
}

interface OutOfBandInvitationService {
  id: string;
  serviceEndpoint: string;
  type: string;
  recipientKeys: string[];
  routingKeys: string[];
}

interface OutOfBandInvitation {
  "@type": string;
  "@id": string;
  label: string;
  accept: string[];
  handshake_protocols: string[];
  services: OutOfBandInvitationService[];
}

interface OutOfBandRecord {
  _tags: Tags;
  metadata?: { [key: string]: string };
  id: string;
  createdAt: string;
  outOfBandInvitation: OutOfBandInvitation;
  role: string;
  state: string;
  autoAcceptConnection: boolean;
  reusable: boolean;
  updatedAt: string;
}

interface ConnectionRecord {
  _tags: { [key: string]: string };
  metadata: { [key: string]: string };
  connectionTypes: string[];
  id: string;
  createdAt: string;
  did: string;
  invitationDid: string;
  theirLabel: string;
  state: string;
  role: string;
  alias: string;
  autoAcceptConnection: boolean;
  threadId: string;
  protocol: string;
  outOfBandId: string;
  updatedAt: string;
}

export interface IReceiveInvitationResponse {
  outOfBandRecord: OutOfBandRecord;
  connectionRecord: ConnectionRecord;
}