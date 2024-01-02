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

  export interface IProofData {
    _tags: {
      connectionId: string;
      state: string;
      threadId: string;
    };
    metadata: Record<string, string>;
    id: string;
    createdAt: string;
    protocolVersion: string;
    state: string;
    connectionId: string;
    threadId: string;
    autoAcceptProof: string;
    updatedAt: string; // or Date as well
    isVerified: boolean;
  }