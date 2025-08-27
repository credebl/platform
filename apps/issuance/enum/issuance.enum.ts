export enum SortFields {
  CREATED_DATE_TIME = 'createDateTime',
  SCHEMA_ID = 'schemaId',
  CONNECTION_ID = 'connectionId',
  STATE = 'state'
}

export enum IssueCredentials {
  proposalSent = 'proposal-sent',
  proposalReceived = 'proposal-received',
  offerSent = 'offer-sent',
  offerReceived = 'offer-received',
  declined = 'decliend',
  requestSent = 'request-sent',
  requestReceived = 'request-received',
  credentialIssued = 'credential-issued',
  credentialReceived = 'credential-received',
  done = 'done',
  abandoned = 'abandoned'
}

export enum IssuedCredentialStatus {
  offerSent = 'Offered',
  done = 'Accepted',
  abandoned = 'Declined',
  received = 'Pending',
  proposalReceived = 'Proposal Received',
  credIssued = 'Credential Issued'
}
