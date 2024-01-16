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

export interface ICreateConnection {
  connectionDto: ICreateConnectionPayload;
  orgId: string;
}

export interface ICreateConnectionPayload {
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

export interface IFetchConnections {
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

export interface IConnectionInvitation {
  message: IInvitation;
}
interface IInvitation {
  invitation: string;

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
export interface IConnectionSearchCriteria {
  pageNumber: number;
  pageSize: number;
  sortField: string;
  sortBy: string;
  searchByText: string;
  user: IUserRequestInterface
}

export interface IReceiveInvitationByUrlOrg {
  user: IUserRequestInterface,
  receiveInvitationUrl: IReceiveInvitationUrl,
  orgId: string
}

export interface IReceiveInvitationUrl extends IReceiveInvite {
  invitationUrl: string;
}

export interface IReceiveInvitationByOrg {
  user: IUserRequestInterface,
  receiveInvitation: IReceiveInvitation,
  orgId: string
}

interface Service {
  id: string;
  serviceEndpoint: string;
  type: string;
  recipientKeys: string[];
  routingKeys: string[];
  accept: string[];
}

interface Invitation {
  '@id': string;
  '@type': string;
  label: string;
  goalCode: string;
  goal: string;
  accept: string[];
  handshake_protocols: string[];
  services: (Service | string)[];
  imageUrl?: string;
}

export interface IReceiveInvite {
  alias?: string;
  label?: string;
  imageUrl?: string;
  autoAcceptConnection?: boolean;
  autoAcceptInvitation?: boolean;
  reuseConnection?: boolean;
  acceptInvitationTimeoutMs?: number;
}

export interface IReceiveInvitation extends IReceiveInvite {
  invitation: Invitation;
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
