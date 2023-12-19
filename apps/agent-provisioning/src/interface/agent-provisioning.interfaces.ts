/* eslint-disable quotes */
import { AgentType } from "@credebl/enum/enum";

export interface IWalletProvision {
    orgId: string;
    externalIp: string;
    walletName: string;
    walletPassword: string;
    seed: string;
    webhookEndpoint: string;
    walletStorageHost: string;
    walletStoragePort: string;
    walletStorageUser: string;
    walletStoragePassword: string;
    internalIp: string;
    containerName: string;
    agentType: AgentType;
    orgName: string;
    indyLedger: string;
    protocol: string;
    afjVersion: string;
    tenant: boolean;
    apiKey?:string;
}

export interface IAgentSpinUp {
    issuerNumber: string;
    issuerName: string;
    externalIp: string;
    genesisUrl: string;
    adminKey: string;
    walletName: string;
    walletPassword: string;
    randomSeed: string;
    apiEndpoint: string;
    walletStorageHost: string;
    walletStoragePort: string;
    walletStorageUser: string;
    walletStoragePassword: string;
    internalIp: string;
    tailsFailServer: string;
    containerName: string;
}

export interface IStartStopAgent {
    action: string;
    orgId: string;
    orgName: string;
}

export interface IAgentStatus {
    apiKey: string;
    agentEndPoint: string;
    orgId: string;
    agentSpinUpStatus: number;
    orgName: string;
}

export interface IPlatformConfig {
    externalIP: string;
    genesisURL: string;
    adminKey: string;
    lastInternalIP: number;
    platformTestNetApiKey: string;
    sgEmailFrom: string;
    apiEndpoint: string;
    tailsFileServer: string;
}
