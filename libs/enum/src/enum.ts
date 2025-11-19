export enum NATSReconnects {
    maxReconnectAttempts = (10 * 60) / 5, // 10 minutes with a reconnection attempt every 5 seconds
    reconnectTimeWait = 5000 // 5 second delay between reconnection attempts
}

export enum SortValue {
    ASC = 'asc',
    DESC = 'desc'
}

export enum SortFields {
    ID = 'id',
    CREATED_DATE_TIME = 'createDateTime',
    NAME = 'name',
    VERSION = 'version',
    LEDGER_ID = 'schemaLedgerId',
    PUBLISHER_DID = 'publisherDid',
    ISSUER_ID = 'issuerId'
}

export enum CredDefSortFields {
    CREATED_DATE_TIME = 'createDateTime',
    TAG = 'tag',
    LEDGER_ID = 'schemaLedgerId',
    CRED_DEF_ID= 'credentialDefinitionId'
}

export enum AgentType {
    // TODO: Change to Credo
    AFJ = 'AFJ',
    ACAPY = 'ACAPY'
}

export declare enum KeyType {
    Ed25519 = 'ed25519',
    Bls12381g1g2 = 'bls12381g1g2',
    Bls12381g1 = 'bls12381g1',
    Bls12381g2 = 'bls12381g2',
    X25519 = 'x25519',
    P256 = 'p256',
    P384 = 'p384',
    P521 = 'p521',
    K256 = 'k256'
}

export enum DidMethod {
    INDY = 'indy',
    KEY = 'key',
    WEB = 'web',
    POLYGON = 'polygon',
    ETHEREUM= 'ethereum'
}

export enum Ledgers {
    Bcovrin_Testnet = 'Bcovrin Testnet',
    Indicio_Testnet = 'Indicio Testnet',
    Indicio_Demonet = 'Indicio Demonet',
    Indicio_Mainnet = 'Indicio Mainnet',
    Not_Applicable = 'NA'
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

export enum schemaRequestType {
    W3C = 'w3c',
    INDY = 'indy'
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
  WORLD_RECORD = 'WorldRecord',
  AYANWORKS_EVENT ='Appreciation Certificate'
}

export enum NodeEnvironment {
   DEVELOPMENT='DEV',
   PRODUCTION='PROD'
}

export enum AutoAccept {
    Always = 'always',
    ContentApproved = 'contentApproved',
    Never = 'never'
}

export enum SortMembers {
    CREATED_DATE_TIME = 'createDateTime',
    STATUS = 'status',
    ID = 'id',
    ORGANIZATION = 'organization'
}

const transitionMap: { [key in Invitation]: Invitation[] } = {
    [Invitation.PENDING]: [Invitation.ACCEPTED, Invitation.REJECTED],
    [Invitation.ACCEPTED]: [],
    [Invitation.REJECTED]: []
};

export const transition = (currentStatus: Invitation, nextStatus: Invitation): boolean => (transitionMap[currentStatus].includes(nextStatus));

export enum SchemaType {
    INDY = 'indy',
    W3C_Schema = 'w3c'
}

export enum IssueCredentialType {
    JSONLD = 'jsonld',
    INDY = 'indy'
}

export enum TemplateIdentifier {
    EMAIL_COLUMN = 'email_identifier'
}

export enum PromiseResult {
    REJECTED = 'rejected',
    FULFILLED = 'fulfilled'
}

export enum PrismaTables {
    PRESENTATIONS = 'presentations',
    CREDENTIALS = 'credentials',
    ECOSYSTEM_ORGS = 'ecosystem_orgs',
    ORG_AGENTS = 'org_agents',
    ORG_DIDS = 'org_dids',
    AGENT_INVITATIONS = 'agent_invitations',
    CONNECTIONS = 'connections',
    ECOSYSTEM_INVITATIONS = 'ecosystem_invitations',
    FILE_UPLOAD = 'file_upload',
    NOTIFICATION = 'notification',
    USER_ACTIVITY = 'user_activity',
    USER_ORG_ROLES = 'user_org_roles',
    ORG_INVITATIONS = 'org_invitations',
    ORGANIZATION = 'organization'
}

export enum IssuanceProcessState {
    PROPOSAL_SENT = 'proposal-sent',
    PROPOSAL_RECEIVED = 'proposal-received',
    OFFER_SENT = 'offer-sent',
    OFFER_RECEIVED = 'offer-received',
    DECLIEND = 'decliend',
    REQUEST_SENT = 'request-sent',
    REQUEST_RECEIVED = 'request-received',
    CREDENTIAL_ISSUED = 'credential-issued',
    CREDENTIAL_RECEIVED = 'credential-received',
    DONE = 'done',
    ABANDONED = 'abandoned'
}

export enum VerificationProcessState {
    PROPOSAL_SENT = 'proposal-sent',
    PROPOSAL_RECEIVED = 'proposal-received',
    REQUEST_SENT = 'request-sent',
    REQUEST_RECEIVED = 'request-received',
    PRESENTATION_SENT = 'presentation-sent',
    PRESENTATION_RECEIVED = 'presentation-received',
    DECLIEND = 'declined',
    ABANDONED = 'abandoned',
    DONE = 'done'
}

export enum ConnectionProcessState {
    START = 'start',
    INVITATION_SENT = 'invitation-sent',
    INVITATION_RECEIVED = 'invitation-received',
    REQUEST_SENT = 'request-sent',
    DECLIEND = 'decliend',
    REQUEST_RECEIVED = 'request-received',
    RESPONSE_SENT = 'response-sent',
    RESPONSE_RECEIVED = 'response-received',
    COMPLETE = 'completed',
    ABANDONED = 'abandoned'
}

export enum SchemaTypeEnum {
    JSON = 'json',
    INDY = 'indy'
  }

export enum W3CSchemaDataType {
    NUMBER = 'number',
    INTEGER = 'integer',
    STRING = 'string',
    DATE_TIME = 'datetime-local'
  }

export enum JSONSchemaType {
    POLYGON_W3C = 'polygon',
    ETHEREUM_W3C = 'ethr',
    LEDGER_LESS = 'no_ledger'
}

export enum NetworkNamespace {
    POLYGON_TESTNET = 'polygon:testnet'
}

export enum LedgerLessMethods {
    WEB = 'web',
    KEY = 'key'
}

export enum LedgerLessConstant {
    NO_LEDGER = 'no_ledger',
}

export enum ledgerLessDIDType {
    DID_KEY = 'did:key',
    DID_WEB = 'did:web'
}

export enum CloudWalletType {
    BASE_WALLET = 'CLOUD_BASE_WALLET',
    SUB_WALLET = 'CLOUD_SUB_WALLET'
}

export enum UserRole {
    DEFAULT_USER = 'DEFAULT_USER',
    HOLDER = 'HOLDER'
}

export enum ProofType {
    POLYGON_PROOFTYPE = 'EcdsaSecp256k1Signature2019',
    NO_LEDGER_PROOFTYPE = 'Ed25519Signature2018'
}
