import { SchemaType } from '@credebl/enum/enum';
import { JsonLdCredentialDetailCredentialStatus } from '../dtos/issuance.dto';
import { JsonValue } from '../utils/helper';

export interface IUserRequestInterface {
    userId: string;
    email: string;
    orgId: string;
    agentEndPoint?: string;
    apiKey?: string;
    tenantId?: string;
    tenantName?: string;
    tenantOrgId?: string;
    userRoleOrgPermissions?: IUserRoleOrgPerms[];
    orgName?: string;
    selectedOrg: ISelectedOrg;
}

export interface ISelectedOrg {
    id: string;
    userId: string;
    orgRoleId: string;
    orgId: string;
    orgRole: object;
    organisation: object;
}

export interface IOrganization {
    name: string;
    description: string;
    org_agents: IOrgAgent[]

}

export interface IOrgAgent {
    orgDid: string;
    verkey: string;
    agentEndPoint: string;
    agentOptions: string;
    walletName: string;
    agentsTypeId: string;
    orgId: string;
}

export class IUserRoleOrgPerms {
    id: number;
    role: IUserRole;
    Organization: IUserOrg;
}

export class IUserRole {
    id: number;
    name: string;
    permissions: string[];

}

export class IUserOrg {
    id: number;
    orgName: string;
}

export interface FileExportResponse {
    response: unknown;
    fileContent: string;
    fileName: string
}

export interface UploadedFileDetails {
    templateId: string;
    fileKey: string;
    fileName: string;
    type: SchemaType
}
export interface IIssuedCredentialSearchParams {
    pageNumber: number;
    pageSize: number;
    sortField: string;
    sortBy: string;
    search: string;
}

export enum IssueCredentialType {
    JSONLD = 'jsonld',
    INDY = 'indy'
}

export interface JsonObject {
    [property: string]: JsonValue
  }

  export interface JsonLdCredentialDetailCredentialStatusOptions {
    type: string
  }

  export interface JsonLdCredentialDetailOptionsOptions {
    proofPurpose: string
    created?: string
    domain?: string
    challenge?: string
    credentialStatus?: JsonLdCredentialDetailCredentialStatus
    proofType: string
  }

  export interface ITemplateFormat {
    credentialDefinitionId: string;
    schemaCredDefName: string;
    schemaName: string;
    schemaVersion: string;
    schemaAttributes: string;
    credentialDefinition: string;
  }