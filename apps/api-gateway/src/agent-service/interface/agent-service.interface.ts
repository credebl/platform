export interface AgentSpinUpSatus {
    agentSpinupStatus: number;
}
export interface AgentStatus {
    label: string;
    endpoints: string[];
    isInitialized: boolean;
}