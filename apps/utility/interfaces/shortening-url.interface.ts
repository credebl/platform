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

interface ServiceDto {
  id: string;
  serviceEndpoint: string;
  type: string;
  recipientKeys: string[];
  routingKeys: string[];
  accept: string[];
}

export interface IInvitation {
  '@id': string;
  '@type': string;
  label: string;
  goalCode: string;
  goal: string;
  accept: string[];
  // eslint-disable-next-line camelcase
  handshake_protocols: string[];
  services: ServiceDto[];
  imageUrl?: string;
}

export interface IStoreObject {
  data: IInvitation;
}