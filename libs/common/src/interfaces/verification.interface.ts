export interface IProofPresentationsListCount {
    proofRequestsCount: number;
    proofRequestsList: IProofPresentationItem[];
  }
  export interface IProofPresentationItem {
    id: string,
    createDateTime: Date;
    createdBy: string;
    connectionId: string;
    state: string;
    orgId: string;
    presentationId: string;  
  }
  export interface IProofPresentationList {
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number;
    previousPage: number;
    lastPage: number;
    data: IProofPresentationItem[];
  }

  export interface IProofPresentationDetails {
    [key: string]: string;
    credDefId: string;
    schemaId: string;
  }
