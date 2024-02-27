export interface IShorteningUrlData {
    referenceId: string,
    schemaId: string,
    credDefId: string,
    invitationUrl: string,
    attributes: IAttributes[]
}
export interface IAttributes {
    [key: string]: string
  }

export interface IUtilities {
    credentialId: string;
    schemaId: string;
    credDefId: string; 
    invitationUrl: string;
    attributes: IAttributes[];
}
// export type StoreObjectDto = InvitationDto;

interface IService {
  id: string;
  serviceEndpoint: string;
  type: string;
  recipientKeys: string[];
  routingKeys: string[];
  accept: string[];
}

export interface ILegacyInvitation {
  '@type': string;
  '@id': string;
  label: string;
  imageUrl?: string;
  recipientKeys: string[];
  serviceEndpoint: string;
  routingKeys: string[]
}

interface IData{
  'base64': string
}

interface IRequestAttach{
  '@id': string,
  'mime-type': string,
  data: IData;
}

export interface IOobIssuanceInvitation {
  '@type': string;
  '@id': string;
  label: string;
  accept: string[];
  handshake_protocols: string[];
  services: IService[];
  'requests~attach': IRequestAttach[]
  // imageUrl?: string;
  // recipientKeys: string[];
  // serviceEndpoint: string;
  // routingKeys: string[]
}

export interface IStoreObject {
  data: ILegacyInvitation | unknown;
}