import { IUserRequestInterface } from './IUserRequestInterface';

export interface IConnectionSearchCriteria {
    pageNumber: number;
    pageSize: number;
    sortField: string;
    sortBy: string;
    searchByText: string;
    user?: IUserRequestInterface
}

export interface IConnectionDetailsById {
    id: string;
    createdAt: string;
    did: string;
    theirDid: string;
    theirLabel: string;
    state: string;
    role: string;
    autoAcceptConnection: boolean;
    threadId: string;
    protocol: string;
    outOfBandId: string;
    updatedAt: string;
  }
