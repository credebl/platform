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
    isReuseConnection?: boolean;
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
  
    interface IDeletedIssuanceRecordsCount {
      count: number;
    }
  
    export interface IDeletedIssuanceRecords {
      deleteResult: IDeletedIssuanceRecordsCount;
      recordsToDelete: IIssuedCredentialResponse[];
    }

    export interface IPrettyVc{
      certificate: string;
      size: string;
      orientation: string;
    }

    interface ICredentialSubject {
      [key: string]: string;
    }
    
    interface ICredential {
      '@context': string[];
      type: string[];
      issuer?: {
        id: string;
      };
      issuanceDate?: string;
      credentialSubject?: ICredentialSubject;
    }
    
    interface IOptions {
      proofType: string;
      proofPurpose: string;
    }
    
    export interface ICredentialData {
      emailId?: string;
      connectionId?: string;
      credential?: ICredential;
      options?: IOptions;
    }
    
    export interface ISchemaObject {
      '$schema': string;
      '$id': string;
      type: string;
      required: string[];
      properties: {
        [key: string]: object;
      };
      definitions: {
        [key: string]: object;
      };
      title: string;
      description: string;
    }