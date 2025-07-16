export interface ICredDefDetails extends IPaginationDetails {
  data: ICredDefWithSchemaData[];
}

export interface ICredDefWithSchemaData {
  createDateTime: Date;
  createdBy: string;
  credentialDefinitionId: string;
  tag: string;
  schemaLedgerId: string;
  schemaId: string;
  orgId: string;
  revocable: boolean;
}

export interface IPlatformCredDefDetails {
  credDefCount: number;
  credDefResult: ICredDefWithSchemaData[];
}

export interface IPaginationDetails {
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number;
  previousPage: number;
  lastPage: number;
}

export interface IPlatformCredDefsData extends IPaginationDetails {
  data: ICredDefWithSchemaData[];
}
