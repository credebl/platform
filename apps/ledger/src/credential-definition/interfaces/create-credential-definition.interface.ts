import { SortValue } from '@credebl/enum/enum';
import { CreateCredentialDefinitionDto } from 'apps/api-gateway/src/credential-definition/dto/create-cred-defs.dto';
import { IUserRequestInterface } from '.';


export interface GetCredDefPayload {
  page?: number;
  searchText?: string;
  itemsPerPage?: number;
  user?: IUserRequestInterface;
  orgId?: string;
  sortValue?: SortValue;
  credDefSortBy?: string;
  supportRevocation?: string;
  credentialDefinitionId?: string;
  orgDid: string;
}

export interface CreateCredDefPayload {
  credDef: CreateCredentialDefinitionDto;
  user: IUserRequestInterface;
  orgId?: string;
}

export interface CredDefPayload {
  userId?: string,
  schemaId?: string;
  tag?: string;
  issuerId?: string;
  credentialDefinitionId?: string;
  issuerDid?: string;
  schemaLedgerId?: string;
  orgId?: string;
  createdBy?: string;
  lastChangedBy?: string;
  autoIssue?: boolean;
  revocable?: boolean;
  orgDid?: string;
}

export interface ICredDefs {
  pageSize?: number;
  pageNumber?: number;
  searchByText?: string;
  sortField?: string;
  revocable?: boolean;
  sortBy?: string;
}

export interface ICredDefList {
  credDefSearchCriteria: ICredDefs,
  user: IUserRequestInterface,
  orgId: string
}

export interface ICredDefBySchemaId {
  schemaId: string
}

export interface ICredDefsCount {
  createDateTime: Date;
  createdBy: string;
  credentialDefinitionId: string;
  tag: string;
  schemaLedgerId: string;
  schemaId: string;
  orgId: string;
  revocable: boolean;
}