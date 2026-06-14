import { IUserRequest } from '@credebl/user-management';
import { organisation } from '@prisma/client';
import {
  IOrgAgentInterface,
  IOrganizationInterface,
  ISelectedOrgInterface,
  IUserRequestInterface
} from '@credebl/common';
import { AgentConnectionSearchCriteria, IConnectionSearchCriteria } from './connection-search.interface';

export { IUserRequestInterface, ISelectedOrgInterface, IOrganizationInterface, IOrgAgentInterface };

export interface IConnection {
  user: IUserRequestInterface;
  alias: string;
  label: string;
  imageUrl: string;
  multiUseInvitation: boolean;
  autoAcceptConnection: boolean;
  goalCode: string;
  goal: string;
  handshake: string;
  handshakeProtocols: string[];
  orgId: string;
  recipientKey?: string;
  invitationDid?: string;
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
  imageUrl: string;
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

export interface GetAllConnections {
  connectionSearchCriteria: AgentConnectionSearchCriteria;
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
  invitationUrl: string;
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

export interface IReceiveInvitationByUrlOrg {
  user: IUserRequestInterface;
  receiveInvitationUrl: IReceiveInvitationUrl;
  orgId: string;
}

export interface IReceiveInvitationUrl extends IReceiveInvite {
  invitationUrl: string;
}

export interface IReceiveInvitationByOrg {
  user: IUserRequestInterface;
  receiveInvitation: IReceiveInvitation;
  orgId: string;
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
  '@type': string;
  '@id': string;
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

export interface ConnectionResponseDetail {
  id: string;
  orgId: string;
  agentId: string;
  connectionInvitation: string;
  multiUse: boolean;
  createDateTime: Date;
  createdBy: number;
  lastChangedDateTime: Date;
  lastChangedBy: number;
  recordId: string;
  invitationDid?: string;
}

export interface ICreateConnectionInvitation {
  label?: string;
  alias?: string;
  imageUrl?: string;
  goalCode?: string;
  goal?: string;
  handshake?: boolean;
  handshakeProtocols?: object[];
  messages?: object[];
  multiUseInvitation?: boolean;
  autoAcceptConnection?: boolean;
  IsReuseConnection?: boolean;
  routing?: object;
  appendedAttachments?: object[];
  orgId?: string;
  recipientKey?: string;
  invitationDid?: string;
}

export interface ICreateOutOfbandConnectionInvitation {
  user: IUserRequestInterface;
  createOutOfBandConnectionInvitation: ICreateConnectionInvitation;
}
