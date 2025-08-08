import { IUserRequestInterface } from '../../interfaces/IUserRequestInterface';
import { ISelectedOrgInterface } from '../../user/interfaces';

export interface IUserRequestSelectedOrgsInterface extends IUserRequestInterface {
  selectedOrg: ISelectedOrgInterface;
}

export interface IOrgAgentInterface {
  orgDid: string;
  verkey: string;
  agentEndPoint: string;
  agentOptions: string;
  walletName: string;
  agentsTypeId: string;
  orgId: string;
}

export interface ISchemaInfo {
  schema: Ischema;
  schemaId: string;
  schemaMetadata: ISchemaMetadata;
}
interface Ischema {
  attrNames: string[];
  name: string;
  version: string;
  issuerId: string;
}

interface ISchemaMetadata {
  didIndyNamespace: string;
  indyLedgerSeqNo: number;
}
