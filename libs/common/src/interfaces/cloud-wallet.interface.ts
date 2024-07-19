import { CloudWalletType } from '@credebl/enum/enum';
import { $Enums } from '@prisma/client';

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

export interface IGetStoredWalletInfo {
  email: string;
  userId: string;
  id: string;
  type: $Enums.CloudWalletType;
  agentEndpoint: string;
}

export interface IConfigureCloudBaseWallet {
  email: string;
  walletKey: string;
  apiKey: string;
  agentEndpoint: string;
}

export interface IConfigureCloudBaseWalletPayload {
  cloudBaseWalletConfigure: IConfigureCloudBaseWallet;
  userId: string;
}

export interface IStoreWalletInfo {
  email: string;
  key: string;
  agentApiKey: string;
  agentEndpoint: string;
  type: CloudWalletType;
  userId: string;
  createdBy: string; 
  lastChangedBy: string
}

export interface IGetStoredWalletInfo {
  email: string;
  userId: string;
  id: string;
  type: $Enums.CloudWalletType;
  agentEndpoint: string;
}

export interface IAcceptProofRequest {
  proofRecordId: string;
  userId: string;
  email: string;
  filterByPresentationPreview?: boolean;
  filterByNonRevocationRequirements?: boolean;
  comment?: string;
}

export interface IAcceptProofRequestPayload {
  acceptProofRequest: IAcceptProofRequest;
  userId: string;
}

export interface IProofByProofId {
  proofId: string;
  userId: string;
}

export interface IProofPresentation {
  threadId: string;
  userId: string;
}

export interface IGetProofPresentationById {
  userId: string;
  email: string;
  proofRecordId: string;
}

export interface IGetProofPresentation {
  userId: string;
  email: string;
  threadId: string;
}

export interface ICloudBaseWalletConfigure {
  walletKey: string;
  apiKey: string;
  agentEndpoint: string;
  userId: string;
  email: string;
}

export interface Tags {
  connectionId: string;
  role: string;
  state: string;
  threadId: string;
}

export interface IProofRequestRes {
  _tags: Tags;
  metadata: unknown;
  id: string;
  createdAt: string;
  protocolVersion: string;
  state: string;
  role: string;
  connectionId: string;
  threadId: string;
  updatedAt: string;
}

export interface CloudWallet {
  id: string;
  label: string;
  tenantId: string;
  email: string;
  type: $Enums.CloudWalletType;
  createDateTime: Date;
  createdBy: string;
  lastChangedDateTime: Date;
  lastChangedBy: string;
  userId: string;
  agentEndpoint: string;
  agentApiKey: string;
  key: string;
  connectionImageUrl: string;
}