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