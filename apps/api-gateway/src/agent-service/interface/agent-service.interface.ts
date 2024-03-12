export interface AgentSpinUpSatus {
    agentSpinupStatus: number;
}
export interface AgentStatus {
    label: string;
    endpoints: string[];
    isInitialized: boolean;
}
interface IWalletConfig {
    id: string;
    key: string;
    keyDerivationMethod: string;
}

interface IConfig {
    label: string;
    walletConfig: IWalletConfig;
}
export interface IWalletRecord {
    _tags: string;
    metadata: string;
    id: string;
    createdAt: string;
    config: IConfig;
    updatedAt: string;
}