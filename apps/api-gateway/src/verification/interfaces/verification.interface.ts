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

export interface ISendProofRequest {
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
