
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
 
export interface JsonArray extends Array<JsonValue> {}
export type JsonObject = {[Key in string]?: JsonValue}
export type JsonValue = string | number | boolean | JsonObject | JsonArray | null
 export interface orgAgents  {
    id: string;
    createDateTime: Date;
    createdBy: string;
    lastChangedDateTime: Date;
    lastChangedBy: string;
    orgDid: string;
    verkey: string;
    agentEndPoint: string;
    agentId: string;
    isDidPublic: boolean;
    agentSpinUpStatus: number;
    agentOptions: Buffer;
    walletName: string | null;
    tenantId: string | null;
    apiKey: string | null;
    agentsTypeId: string | null;
    orgId: string | null;
    orgAgentTypeId: string | null;
    ledgerId: string | null;
    didDocument: JsonValue;
    webhookUrl: string | null;
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
    recipientKey?:string;
    invitationDid?: string
}
  
export interface IDeletedConnectionsRecord {
  getConnectionRecords: IConnectionItem[];
  deleteConnectionRecords: {
      count: number;
  };
}