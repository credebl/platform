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