export interface InvitationMessage {
    message: {
      invitationUrl: string;
      invitation: {
        '@type': string;
        '@id': string;
        label: string;
        recipientKeys: string[];
        serviceEndpoint: string;
        routingKeys: string[];
      };
      outOfBandRecord: OutOfBandRecord;
      recipientKey?:string
      invitationDid?: string
    };
  }
  
  interface OutOfBandRecord {
    _tags: Tags;
    metadata?: { [key: string]: string };
    id: string;
    createdAt: string;
    outOfBandInvitation: OutOfBandInvitation;
    role: string;
    state: string;
    autoAcceptConnection: boolean;
    reusable: boolean;
    updatedAt: string;
  }
  
  interface Tags {
    invitationId: string;
    recipientKeyFingerprints: string[];
    role: string;
    state: string;
    threadId: string;
  }
  
  interface OutOfBandInvitation {
    '@type': string;
    '@id': string;
    label: string;
    accept: string[];
    handshake_protocols: string[];
    services: OutOfBandInvitationService[];
  }
  
  interface OutOfBandInvitationService {
    id: string;
    serviceEndpoint: string;
    type: string;
    recipientKeys: string[];
    routingKeys: string[];
  }
  