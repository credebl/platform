import { JSONSchemaType, SchemaTypeEnum, W3CSchemaDataType } from '@credebl/enum/enum';
import { UserRoleOrgPermsDto } from '../dtos/user-role-org-perms.dto';

export interface IUserRequestInterface {
  id: string;
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
  organisation: IOrganizationInterface;
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

export interface AgentDetails {
    orgDid: string;
    agentEndPoint: string;
    tenantId: string
}

export interface ISchemaData {
  createDateTime: Date;
  createdBy: string;
  name: string;
  version: string;
  attributes: string;
  schemaLedgerId: string;
  publisherDid: string;
  issuerId: string;
  orgId: string;
  ledgerId?: string;
  id?: string;
}

export interface ISchemasWithCount {
  schemasCount: number;
  schemasResult: ISchemaData[];
}
interface IW3CAttributeValue {
  attributeName: string;
  schemaDataType: W3CSchemaDataType;
  displayName: string;
  isRequired: boolean;
}

interface IAttributeValue {
  attributeName: string;
  schemaDataType: string;
  displayName: string;
  isRequired: boolean;
}

export interface ICreateSchema {
  schemaVersion?: string;
  schemaName: string;
  attributes: IAttributeValue[];
  orgId?: string;  
  orgDid?: string;
}
export interface ICreateW3CSchema {
  attributes: IW3CAttributeValue[];
  schemaName: string;
  description: string;
  schemaType: JSONSchemaType;
}
export interface IGenericSchema {
  type: SchemaTypeEnum;
  schemaPayload: ICreateSchema | ICreateW3CSchema;
}

export interface IschemaPayload {
  schemaDetails: IGenericSchema,
  user: IUserRequestInterface,
  orgId: string
}
export interface ISchemasResult {
  id: string;
  createDateTime: Date;
  createdBy: string;
  lastChangedDateTime: Date;
  lastChangedBy: string;
  name: string;
  version: string;
  attributes: string;
  schemaLedgerId: string;
  publisherDid: string;
  issuerId: string;
  orgId: string;
  ledgerId: string;
  type: string;
}

export interface ISchemasList {
  schemasCount: number;
  schemasResult: ISchemasResult[];
}