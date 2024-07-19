import { CloudWalletType } from '@credebl/enum/enum';

export class ICreateCloudWallet {
    label: string;
    connectionImageUrl?: string;
    email?: string;
    userId?: string;
  }

export interface ICloudWalletDetails {
    label: string;
    tenantId: string;
    email?: string;
    type: CloudWalletType;
    createdBy: string;
    lastChangedBy: string;
    userId: string;
    agentEndpoint?: string;
    agentApiKey?: string;
    key?: string;
    connectionImageUrl?: string;
  }

export interface IStoredWalletDetails {
  email: string,
  connectionImageUrl: string,
  createDateTime: Date,
  id: string,
  tenantId: string,
  label: string,
  lastChangedDateTime: Date
}

export interface IReceiveInvitation {
  alias?: string;
  label?: string;
  imageUrl?: string;
  autoAcceptConnection?: boolean;
  autoAcceptInvitation?: boolean;
  reuseConnection?: boolean;
  acceptInvitationTimeoutMs?: number;
  ourDid?: string;
  invitationUrl: string;
  email?: string;
  userId?: string;
}

export interface IAcceptOffer {
  autoAcceptCredential?: string;
  comment?: string;
  credentialRecordId: string;
  credentialFormats?: object;
  email?: string;
  userId?: string;
}

export interface ICreateCloudWalletDid {
  seed?: string;
  keyType: string;
  method: string;
  network?: string;
  domain?: string;
  role?: string;
  privatekey?: string;
  endpoint?: string;
  did?: string;
  endorserDid?: string;
  isPrimaryDid: boolean;
  email?: string;
  userId?: string;
}
