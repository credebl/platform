import { OpenId4VcIssuanceSessionState } from '@credebl/enum/enum';

/* ---------------------------------------------------------
 * Enums
 * --------------------------------------------------------- */
export enum CredentialFormat {
  SdJwtVc = 'vc+sd-jwt',
  MsoMdoc = 'mso_mdoc'
}

export enum SignerMethodOption {
  DID = 'did',
  X5C = 'x5c'
}

export interface ISignerOption {
  method: SignerMethodOption;
  did?: string;
  x5c?: string[];
}

export enum AuthenticationType {
  PRE_AUTHORIZED_CODE = 'pre-authorized_code',
  AUTHORIZATION_CODE = 'authorization_code'
}

/* ---------------------------------------------------------
 * Interfaces
 * --------------------------------------------------------- */
export type DisclosureFrame = Record<string, boolean | Record<string, boolean>>;

export interface CredentialPayload {
  [key: string]: unknown; // extensible for mDoc or other formats
}

export interface CredentialRequest {
  templateId: string;
  payload: CredentialPayload;
  validityInfo?: {
    validFrom: Date;
    validUntil: Date;
  };
}

export interface CreateOidcCredentialOffer {
  // e.g. "abc-gov"
  authenticationType: AuthenticationType; // only option selector
  credentials: CredentialRequest[]; // one or more credentials
}

export interface GetAllCredentialOffer {
  publicIssuerId?: string;
  preAuthorizedCode?: string;
  state?: OpenId4VcIssuanceSessionState;
  credentialOfferUri?: string;
  authorizationCode?: string;
}

export interface UpdateCredentialRequest {
  issuerId: string;
  credentialOfferId: string;
  issuerMetadata: object;
}
