import { IUserRequestInterface } from "../../interfaces/IUserRequestInterface";

export interface IProofRequestAttribute {
    attributeName: string;
    condition?: string;
    value?: string;
    credDefId: string;
    credentialName: string;
}

export interface IProofRequestSearchCriteria {
    pageNumber: number;
    pageSize: number;
    sortField: string;
    sortBy: string;
    searchByText: string;
    user?: IUserRequestInterface
}

export interface IProofRequest {
    metadata: object;
    id: string;
} 
export interface IProofPresentation {
    createdAt: string;
    protocolVersion: string;
    state: string;
    connectionId: string;
    threadId: string;
    autoAcceptProof: string;
    updatedAt: string;
    isVerified: boolean;
  }

export interface IPresentation {
    _tags: ITags;
    metadata: object;
    id: string;
    createdAt: string;
    protocolVersion: string;
    state: string;
    connectionId: string;
    threadId: string;
    autoAcceptProof: string;
    updatedAt: string;
    isVerified: boolean;
  }

interface ITags {
    connectionId: string;
    state: string;
    threadId: string;
}  
