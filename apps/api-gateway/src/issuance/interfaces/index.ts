import { SchemaType } from '@credebl/common/enum/enum';
import { JsonLdCredentialDetailCredentialStatus } from '../dtos/issuance.dto';
import { JsonValue } from '../utils/helper';

export {
  IUserRequestInterface,
  ISelectedOrgInterface,
  IOrganizationInterface,
  IOrgAgentInterface,
  UserRoleOrgPermsDto
} from '@credebl/common';
export { IOrgAgentInterface as IOrgAgent } from '@credebl/common';

export interface FileExportResponse {
  response: unknown;
  fileContent: string;
  fileName: string;
}

export interface UploadedFileDetails {
  templateId: string;
  fileKey: string;
  fileName: string;
  type: SchemaType;
  isValidateSchema?: boolean;
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
  [property: string]: JsonValue;
}

export interface JsonLdCredentialDetailCredentialStatusOptions {
  type: string;
}

export interface JsonLdCredentialDetailOptionsOptions {
  proofPurpose: string;
  created?: string;
  domain?: string;
  challenge?: string;
  credentialStatus?: JsonLdCredentialDetailCredentialStatus;
  proofType: string;
}

export interface ITemplateFormat {
  credentialDefinitionId: string;
  schemaCredDefName: string;
  schemaName: string;
  schemaVersion: string;
  schemaAttributes: string;
  credentialDefinition: string;
}

export interface IReqPayload {
  credDefId: string;
  fileKey: string | null;
  fileName: string;
}
