export enum SortValue {
    ASC = 'ASC',
    DESC = 'DESC'
}

export enum AgentType {
    AFJ = '1',
    ACAPY = '2'
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

export enum EndorserTransactionType{
    SCHEMA = 'schema',
    CREDENTIAL_DEFINITION = 'credential-definition',
}

export enum OrgAgentType {
    DEDICATED = `1`,
    SHARED = `2`
}
