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

export interface SignerOption {
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
  full_name?: string;
  birth_date?: string; // YYYY-MM-DD if present
  birth_place?: string;
  parent_names?: string;
  [key: string]: unknown; // extensible for mDoc or other formats
}

export interface CredentialRequest {
  credentialSupportedId?: string;
  templateId: string;
  format: CredentialFormat; // "vc+sd-jwt" | "mso_mdoc"
  payload: CredentialPayload; // user-supplied payload (without vct)
  disclosureFrame?: DisclosureFrame; // only relevant for vc+sd-jwt
}

export interface CreateOidcCredentialOffer {
  // e.g. "abc-gov"
  // signerMethod: SignerMethodOption;      // only option selector
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
