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

// interface IService {
//   id: string;
//   serviceEndpoint: string;
//   type: string;
//   recipientKeys: string[];
//   routingKeys: string[];
//   accept: string[];
// }

export interface ILegacyInvitation {
  '@type': string;
  '@id': string;
  label: string;
  imageUrl?: string;
  recipientKeys: string[];
  serviceEndpoint: string;
  routingKeys: string[]
}

export interface IStoreObject {
  data: ILegacyInvitation;
}