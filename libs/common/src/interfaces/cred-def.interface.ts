export interface ICredDefDetails extends IPaginationDetails{
    data: ICredDefData[];
}

export interface ICredDefData {
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
    credDefResult: ICredDefData[];
  }

  export interface IPaginationDetails {
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number;
    previousPage: number;
    lastPage: number;
  }
  
  export interface IPlatformCredDefsData extends IPaginationDetails{
    data: ICredDefData[];
  }
   