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

export interface ICredentialOfferResponse {
    statusCode: number;
    message: string;
    data: ICredentialOfferData[];
  }
  
  interface ICredentialOfferData {
    statusCode: number;
    message: string;
    error?: string;
    data?: ICredentialOfferDetails;
  }
  
  interface ICredentialAttribute {
    'mime-type': string;
    name: string;
    value: string;
  }
  
  interface ICredentialOfferDetails {
    _tags?: {
      connectionId: string;
      state: string;
      threadId: string;
    };
    metadata?: {
      '_anoncreds/credential'?: {
        schemaId: string;
        credentialDefinitionId: string;
      };
    };
    credentials?: unknown[];
    id: string;
    createdAt: string;
    state: string;
    connectionId: string;
    threadId: string;
    protocolVersion: string;
    credentialAttributes?: ICredentialAttribute[];
    autoAcceptCredential?: string;
    contextCorrelationId?: string;
    }
  