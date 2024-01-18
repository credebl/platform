export enum SortValue {
    ASC = 'asc',
    DESC = 'desc'
}

export enum AgentType {
    AFJ = 'AFJ',
    ACAPY = 'ACAPY'
}

export enum Ledgers {
    Bcovrin_Testnet = 'Bcovrin Testnet',
    Indicio_Testnet = 'Indicio Testnet',
    Indicio_Demonet = 'Indicio Demonet',
    Indicio_Mainnet = 'Indicio Mainnet',
}

export enum Invitation {
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    PENDING = 'pending'
}

export enum EcosystemRoles {
    ECOSYSTEM_LEAD = 'Ecosystem Lead',
    ECOSYSTEM_MEMBER = 'Ecosystem Member',
    ECOSYSTEM_OWNER = 'Ecosystem Owner'
}

export enum EcosystemConfigSettings {
    URL = 'url',
    ENABLE_ECOSYSTEM = 'enableEcosystem',
    AUTO_ENDORSEMENT = 'autoEndorsement',
    PARTICIPATE_IN_ECOSYSTEM = 'participateInEcosystem',
    MULTI_ECOSYSTEM = 'multiEcosystemSupport'

}

export enum EndorserTransactionType {
    SCHEMA = 'schema',
    CREDENTIAL_DEFINITION = 'credential-definition',
}

export enum OrgAgentType {
    DEDICATED = 'DEDICATED',
    SHARED = 'SHARED'
}

export enum AgentSpinUpStatus {
    PENDING = 0,
    PROCESSED = 1,
    COMPLETED = 2
}

export enum UserCertificateId {
    WINNER = 'Winner',
    PARTICIPANT = 'Participant',
    ARBITER = 'Arbiter',
    WORLD_RECORD = 'WorldRecord'
}

const transitionMap: { [key in Invitation]: Invitation[] } = {
    [Invitation.PENDING]: [Invitation.ACCEPTED, Invitation.REJECTED],
    [Invitation.ACCEPTED]: [],
    [Invitation.REJECTED]: []
};

export const transition = (currentStatus: Invitation, nextStatus: Invitation): boolean => (transitionMap[currentStatus].includes(nextStatus));