import { Prisma } from '@prisma/client';

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
    schemaId?: string; 
    emailId?: string
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
    credDefId?: string;
    schemaId: string;
    certificateTemplate?: string;
  }
  export interface IVerificationRecords {
    deleteResult: Prisma.BatchPayload;
    recordsToDelete: IRecords[]
  }

interface IRecords {
    id: string;
    createDateTime: Date;
    createdBy: string;
    lastChangedDateTime: Date;
    lastChangedBy: string;
    connectionId: string;
    orgId: string;
    presentationId: string;
    isVerified: boolean;
    threadId: string;
    state: string;
}
