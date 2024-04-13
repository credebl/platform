export enum SortValue {
    ASC = 'asc',
    DESC = 'desc'
}

export enum AgentType {
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
    POLYGON = 'polygon'
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
  WORLD_RECORD = 'WorldRecord',
  AYANWORKS_EVENT ='Appreciation Certificate'
}

export enum NodeEnvironment {
   DEVELOPMENT='DEV',
   PRODUCTION='PROD'
}

export enum AutoAccept {
    Always = "always",
    ContentApproved = "contentApproved",
    Never = "never"
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

export enum CertificateDetails {
    PINNACLE_CRED_DEF = 'PKDMuYSzJE22Jkh4B1EMiX:3:CL:826:Pinnacle Certificate'
}

export const transition = (currentStatus: Invitation, nextStatus: Invitation): boolean => (transitionMap[currentStatus].includes(nextStatus));