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

export class GetAllCredDefsDto {
  pageSize?: number;
  pageNumber?: number;
  searchByText?: string;
  sorting?: string;
  revocable?: boolean;
  sortByValue?: string;
}

export interface GetAllCredDefsPayload {
  credDefSearchCriteria: GetAllCredDefsDto,
  user: IUserRequestInterface,
  orgId: string
}

export interface GetCredDefBySchemaId {
  schemaId: string
}