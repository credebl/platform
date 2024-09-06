import { CloudWalletType } from '@credebl/enum/enum';
import { $Enums, user } from '@prisma/client';

export interface IConfigureCloudBaseWallet {
    email: string;
    walletKey: string;
    apiKey: string;
    agentEndpoint: string;
}

export interface IConfigureCloudBaseWalletPayload {
    cloudBaseWalletConfigure: IConfigureCloudBaseWallet,
    user: user
}

export interface IStoreWalletInfo {
    email: string;
    walletKey: string;
    apiKey: string;
    agentEndpoint: string;
    type: CloudWalletType;
    userId: string;
}

export interface IGetStoredWalletInfo {
    email: string;
    userId: string;
    id: string;
    type: $Enums.CloudWalletType;
    agentEndpoint: string;
}