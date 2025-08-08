export interface IOrgAgentInterface {
  orgDid: string;
  verkey: string;
  agentEndPoint: string;
  agentOptions: string;
  walletName: string;
  agentsTypeId: string;
  orgId: string;
}
export interface ICredDef {
  id: string;
  createDateTime: string;
  createdBy: string;
  credentialDefinitionId: string;
  tag: string;
  schemaLedgerId: string;
  schemaId: string;
  revocable: boolean;
  orgId: string;
}

export interface ICredDefs extends ICredDef {
  lastChangedDateTime: string;
  lastChangedBy: string;
}

export interface ICredentialDefinition {
  credentialDefinitionId: string;
  schemaCredDefName: string;
  schemaName: string;
  schemaVersion: string;
  schemaAttributes: string;
  credentialDefinition: string;
}
