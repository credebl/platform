export {
  IUserRequestInterface,
  ISelectedOrgInterface,
  IOrganizationInterface,
  IOrgAgentInterface,
  UserRoleOrgPermsDto
} from '@credebl/common';

export interface ISchemaInfo {
  schema: ISchema;
  schemaId: string;
  schemaMetadata: ISchemaMetadata;
}

interface ISchema {
  attrNames: string[];
  name: string;
  version: string;
  issuerId: string;
}

interface ISchemaMetadata {
  didIndyNamespace: string;
  indyLedgerSeqNo: number;
}
