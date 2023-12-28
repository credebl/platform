export interface IIssuedCredentialResponse {
    createDateTime: Date;
    createdBy: string;
    connectionId: string;
    schemaId: string;
    state: string;
    orgId: string;
  }

export interface IIssuedCredential {
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number;
    previousPage: number;
    lastPage: number;
    data: IIssuedCredentialResponse[];
  }