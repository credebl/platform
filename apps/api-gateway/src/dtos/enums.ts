export enum OrgRequestStatus {
    All = 'all',
    Accepted = 'accepted',
    Pending = 'pending',
    Rejected = 'rejected',
}

export enum ActiveFlags {
    All = 'all',
    True = 'true',
    False = 'false',
}

export enum NonAdminUserStae {
    All = 'all',
    Active = 'active',
    InActive = 'inactive',
    Pending = 'pending'
}

export enum IssueCredStatus {
    All = 'all',
    Credential_issued = 'credential_issued',
    Credential_revoke = 'credential_revoke',
    Non_revoke = 'non_revoke'
}

export enum AgentActions {
    Start = 'START',
    Stop = 'STOP',
    Status = 'STATUS',
}

export enum TenantStatus {
    All = 'all',
    Accepted = 'accepted',
    Pending = 'pending',
    Rejected = 'rejected',
}

export enum OrgInvitationStatus {
    All = 'all',
    Accepted = 'accepted',
    Pending = 'pending'
}

export enum FileRecordStatus {
    All = 'ALL',
    Success = 'SUCCESS',
    Error = 'ERROR'    
}
