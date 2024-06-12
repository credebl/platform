export enum EcosystemRoles {
    ECOSYSTEM_LEAD = 'Ecosystem Lead',
    ECOSYSTEM_MEMBER = 'Ecosystem Member',
    ECOSYSTEM_OWNER = 'Ecosystem Owner'
}

export enum EcosystemOrgStatus {
    ACTIVE = 'ACTIVE'
}

export enum EcosystemInvitationStatus {
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    PENDING = 'pending'
}

export enum endorsementTransactionStatus {
    REQUESTED = 'requested',
    SIGNED = 'signed',
    DECLINED = 'declined',
    SUBMITED = 'submited'
}

export enum endorsementTransactionType {
    SCHEMA = 'schema',
    W3C_SCHEMA = 'w3c Schema',
    CREDENTIAL_DEFINITION = 'credential-definition',
    SIGN = 'sign',
    SUBMIT = 'submit'
}

export enum DeploymentModeType {
    PROVIDER_HOSTED = 'ProviderHosted',
    ON_PREMISE = 'OnPremise'
}

