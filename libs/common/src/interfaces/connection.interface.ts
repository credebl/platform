export interface IConnectionsListCount {
    connectionCount: number;
    connectionsList: IConnectionItem[];
  }
  export interface IConnectionItem {
    createDateTime: Date;
    createdBy: string;
    connectionId: string;
    theirLabel: string;
    state: string;
    orgId: string;
  }
  export interface IConnectionList {
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number;
    previousPage: number;
    lastPage: number;
    data: IConnectionItem[];
  }

  export interface ICreateConnectionUrl {
    id: string;
    orgId: string;
    agentId: string;
    connectionInvitation: string;
    multiUse: boolean;
    createDateTime: Date;
    createdBy: number;
    lastChangedDateTime: Date;
    lastChangedBy: number;
}
  