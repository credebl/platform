import { OpenId4VcIssuanceSessionState } from '@credebl/enum/enum';
import { VCVersion } from '@credebl/common/vc';

/* ---------------------------------------------------------
 * Enums
 * --------------------------------------------------------- */
export enum CredentialFormat {
  SdJwtVc = 'vc+sd-jwt',
  MsoMdoc = 'mso_mdoc',
  JwtVcJsonLd = 'jwt_vc_json-ld',
  LdpVc = 'ldp_vc'
}

export enum SignerMethodOption {
  DID = 'did',
  X5C = 'x5c'
}

export interface ISignerOption {
  method: SignerMethodOption;
  did?: string;
  x5c?: string[];
  keyId?: string;
}

export enum AuthenticationType {
  PRE_AUTHORIZED_CODE = 'preAuthorizedCodeFlow',
  AUTHORIZATION_CODE = 'authorizationCodeFlow',
  NO_AUTH = 'noAuth'
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
  /**
   * Optional VC version guard. Must match the version implied by the template context
   * (defaults to the template context, or v1.1 when the template has no context configured).
   */
  version?: VCVersion;
}

export interface CreateOidcCredentialOffer {
  // e.g. "abc-gov"
  authenticationType: AuthenticationType; // only option selector
  credentials: CredentialRequest[]; // one or more credentials
  noticeUrl?: string;
  isRevocable?: boolean;
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
