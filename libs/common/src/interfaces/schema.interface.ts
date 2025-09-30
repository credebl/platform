import { ICredDefData } from './cred-def.interface';

export interface IPaginationDetails {
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number;
  previousPage: number;
  lastPage: number;
}

export interface ISchemasWithPagination extends IPaginationDetails {
  data: ISchemaData[];
}

export interface ISchemaData extends ISchema {
  orgId: string;
}

export interface ISchemaDetails extends IPaginationDetails {
  data: ISchema[];
}

export interface IW3CSchema {
  response: {
    did: string;
    schemaId: string;
    schemaTxnHash: string;
    resourceTxnHash: string;
  };
}
interface ISchema {
  createDateTime: Date;
  createdBy: string;
  name: string;
  schemaLedgerId: string;
  version: string;
  attributes: string;
  publisherDid: string;
  issuerId: string;
}

interface Attribute {
  attributeName: string;
  schemaDataType: string;
  displayName: string;
  isRequired: boolean;
}

export interface ISchemaDetail {
  id: string;
  createDateTime: string;
  createdBy: string;
  lastChangedDateTime: string;
  lastChangedBy: string;
  name: string;
  version: string;
  attributes: Attribute[];
  schemaLedgerId: string;
  publisherDid: string;
  issuerId: string;
  orgId: string;
  ledgerId: string;
  type: string;
  isSchemaArchived: boolean;
  organisation: {
    name: string;
  };
}

export interface IPlatformSchemas {
  schemasCount: number;
  schemasResult: ISchemaData[];
}

export interface PartialICredDefData extends Omit<ICredDefData, 'createdBy' | 'schemaId' | 'orgId'> {}

export interface ICredDefWithPagination extends IPaginationDetails {
  data: PartialICredDefData[];
}

export interface ICredDefWithCount {
  credDefCount: number;
  credDefResult: PartialICredDefData[];
}

export interface INetworkUrl {
  networkUrl: string;
}

export interface ISchemaFields {
  name?: string;
  schemaName?: string;
  attributes?: IIndySchemaAttributesValue[];
  schemaAttributes?: IW3CSchemaAttributesValue[];
  endorse?: boolean;
  version?: string;
  did?: string;
  description?: string;
}

interface IIndySchemaAttributesValue {
  attributeName: string;
  schemaDataType: string;
  displayName: string;
}

interface IW3CSchemaAttributesValue {
  title: string;
  type: string;
}

export interface ISchemaDataWithOrg extends ISchemaData {
  organisation: {
    name: string;
  };
}

export interface IPlatformSchemasWithOrg {
  schemasCount: number;
  schemasResult: ISchemaDataWithOrg[];
}
