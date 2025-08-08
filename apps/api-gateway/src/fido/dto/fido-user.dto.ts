export interface Response {
  attestationObject: string;
  clientDataJSON: string;
  transports: [];
}

export interface ClientExtensionResults {
  credProps: CredProps;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CredProps {}

export interface Response {
  authenticatorData: string;
  clientDataJSON: string;
  signature: string;
  userHandle: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ClientExtensionResults {}
