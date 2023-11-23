export enum sortValue {
    ASC = 'ASC',
    DESC = 'DESC',
}
export enum SortValue {
    ASC = 'ASC',
    DESC = 'DESC',
}
export enum onboardRequestSort {
    id = 'id',
    orgName = 'orgName',
    createDateTime = 'createDateTime',
    isEmailVerified = 'isEmailVerified',
    lastChangedDateTime = 'lastChangedDateTime'
}

export enum schemaSortBy {
    id = 'id',
    schemaName = 'schemaName',
    createDateTime = 'createDateTime'
}

export enum credDefSortBy {
    id = 'id',
    createDateTime = 'createDateTime',
    tag = 'tag'
}

export enum connectionSortBy {
    id = 'id',
    theirLabel = 'theirLabel',
    createDateTime = 'createdAt'
}
export enum credentialSortBy {
    id = 'id',
    createDateTime = 'createDateTime'
}

// export enum credRevokeStatus {
//     all = 'all',
//     revoke = 'revoke',
//     notRevoke = 'notRevoke'
// }

export enum booleanStatus {
    all = 'all',
    true = 'true',
    false = 'false'
}

export enum orgPresentProofRequestsSort {
    id = 'id',
    holderName = 'theirLabel',
    createDateTime = 'createDateTime'
}

export enum orgHolderRequestsSort {
    id = 'id',
    holderName = 'theirLabel',
    createDateTime = 'createDateTime'
}

export enum holderProofRequestsSort {
    id = 'id',
    createDateTime = 'createDateTime'
}


export enum OnboardRequestSort {
    id = 'id',
    createDateTime = 'createDateTime',
    orgName = 'orgName'
}

export enum CategorySortBy {
    id = 'id',
    Name = 'name'
}
export enum CredDefSortBy {
    id = 'id',
    createDateTime = 'createDateTime',
    tag = 'tag'
}
export enum transactionSort {
    id = 'id',
    createDateTime = 'createDateTime',
}

export enum ConnectionAlias {
    endorser = 'ENDORSER',
    author = 'AUTHOR',
}

export enum TransactionRole {
    transactionAuthor = 'TRANSACTION_AUTHOR',
    transactionEndorser = 'TRANSACTION_ENDORSER',
}

export enum TransactionType {
    schema = 'SCHEMA',
    credDef = 'CREDENTIAL_DEF',
}

export enum OrderBy {
    ASC = 'ASC',
    DESC = 'DESC',
}

export enum EmailAuditOrderByColumns {
    CreatedDateTime = 'createDateTime',
    Id = 'id',
}

export enum ExpiredSubscriptionSortBy {
    startDate = 'startDate',
    endDate = 'endDate',
    id = 'id',
}

export enum FileUploadType {
    Issuance = 'ISSUANCE'
}

export enum FileUploadStatus {
    started = 'PROCESS_STARTED',
    completed = 'PROCESS_COMPLETED',
    interrupted= 'PROCESS_INTERRUPTED',
    retry= 'PROCESS_REINITIATED',
    partially_completed= 'PARTIALLY_COMPLETED'
}
