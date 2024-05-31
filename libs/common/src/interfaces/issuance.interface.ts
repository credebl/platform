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
  interface CredentialData {
    email_identifier: string;
    [key: string]: string;
  }
  export interface IJsonldCredential {
    schemaName: string;
    schemaLedgerId: string;
    credentialData: CredentialData
    orgDid: string;
    orgId: string;
  }