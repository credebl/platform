export interface ICredentialSubject {
  [key: string]: string;
}

export interface ICredentialIssuer {
  id: string;
  [key: string]: unknown;
}

export interface ICredential {
  '@context': string[];
  type: string[];
  issuer?: ICredentialIssuer | string;
  issuanceDate?: string;
  validFrom?: string;
  expirationDate?: string;
  validUntil?: string;
  credentialSubject?: ICredentialSubject | ICredentialSubject[];
  credentialStatus?: unknown;
  credentialSchema?: unknown;
  id?: string;
  [key: string]: unknown;
}

export interface IOptions {
  proofType: string;
  proofPurpose: string;
}

export interface ICredentialData {
  emailId?: string;
  connectionId?: string;
  credential?: ICredential;
  options?: IOptions;
}
