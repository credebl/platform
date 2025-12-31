import { X509ExtendedKeyUsage, X509KeyUsage, x5cKeyType, KeyType } from '@credebl/enum/enum';
import { IPaginationSortingDto } from './interface';

// Enum remains the same
export enum GeneralNameType {
  DNS = 'dns',
  DN = 'dn',
  EMAIL = 'email',
  GUID = 'guid',
  IP = 'ip',
  URL = 'url',
  UPN = 'upn',
  REGISTERED_ID = 'id'
}

export interface AuthorityAndSubjectKey {
  //   /**
  //    * @example "my-seed-12345"
  //    * @description Seed to deterministically derive the key (optional)
  //    */
  //   seed?: string;

  //   /**
  //    * @example "3yPQbnk6WwLgX8K3JZ4t7vBnJ8XqY2mMpRcD9fNvGtHw"
  //    * @description publicKeyBase58 for using existing key in wallet (optional)
  //    */
  //   publicKeyBase58?: string;

  /**
   * @example "p256"
   * @description Type of the key used for signing the X.509 Certificate (default is p256)
   */
  keyType?: x5cKeyType;
}

export interface Name {
  /**
   * @example "dns"
   */
  type: GeneralNameType;

  /**
   * @example "example.com"
   */
  value: string;
}

export interface X509CertificateIssuerAndSubjectOptions {
  /**
   * @example "US"
   */
  countryName?: string;

  /**
   * @example "California"
   */
  stateOrProvinceName?: string;

  /**
   * @example "IT Department"
   */
  organizationalUnit?: string;

  /**
   * @example "Example Corporation"
   */
  commonName?: string;
}

export interface Validity {
  /**
   * @example "2024-01-01T00:00:00.000Z"
   */
  notBefore?: Date;

  /**
   * @example "2025-01-01T00:00:00.000Z"
   */
  notAfter?: Date;
}

export interface KeyUsage {
  /**
   * @example ["digitalSignature", "keyEncipherment", "crlSign"]
   */
  usages: X509KeyUsage[];

  /**
   * @example true
   */
  markAsCritical?: boolean;
}

export interface ExtendedKeyUsage {
  /**
   * @example ["MdlDs", "ServerAuth", "ClientAuth"]
   */
  usages: X509ExtendedKeyUsage[];

  /**
   * @example true
   */
  markAsCritical?: boolean;
}

export interface NameList {
  /**
   * @example [{ "type": "dns", "value": "example.com" }, { "type": "email", "value": "admin@example.com" }]
   */
  name: Name[];

  /**
   * @example true
   */
  markAsCritical?: boolean;
}

export interface AuthorityAndSubjectKeyIdentifier {
  /**
   * @example true
   */
  include: boolean;

  /**
   * @example true
   */
  markAsCritical?: boolean;
}

export interface BasicConstraints {
  /**
   * @example false
   */
  ca: boolean;

  /**
   * @example 0
   */
  pathLenConstraint?: number;

  /**
   * @example true
   */
  markAsCritical?: boolean;
}

export interface CrlDistributionPoints {
  /**
   * @example ["http://crl.example.com/ca.crl"]
   */
  urls: string[];

  /**
   * @example true
   */
  markAsCritical?: boolean;
}

export interface X509CertificateExtensionsOptions {
  keyUsage?: KeyUsage;
  extendedKeyUsage?: ExtendedKeyUsage;
  authorityKeyIdentifier?: AuthorityAndSubjectKeyIdentifier;
  subjectKeyIdentifier?: AuthorityAndSubjectKeyIdentifier;
  issuerAlternativeName?: NameList;
  subjectAlternativeName?: NameList;
  basicConstraints?: BasicConstraints;
  crlDistributionPoints?: CrlDistributionPoints;
}

export interface X509CreateCertificateOptions {
  authorityKey?: AuthorityAndSubjectKey;
  subjectPublicKey?: AuthorityAndSubjectKey;

  /**
   * @example "1234567890"
   */
  serialNumber?: string;

  /**
   * @example {
   *   "countryName": "US",
   *   "stateOrProvinceName": "California",
   *   "commonName": "Example CA"
   * }
   * OR
   * @example "/C=US/ST=California/O=Example Corporation/CN=Example CA"
   */
  issuer: X509CertificateIssuerAndSubjectOptions | string;

  /**
   * @example {
   *   "countryName": "US",
   *   "commonName": "www.example.com"
   * }
   * OR
   * @example "/C=US/CN=www.example.com"
   */
  subject?: X509CertificateIssuerAndSubjectOptions | string;

  validity?: Validity;
  extensions?: X509CertificateExtensionsOptions;
}

export interface X509CertificateRecord {
  id: string;
  orgAgentId: string;
  keyType: string;
  status: string;
  validFrom: Date;
  expiry: Date;
  certificateBase64: string;
  createdBy: string;
  lastChangedBy: string;
  createdAt: Date;
  lastChangedDateTime: Date;
}

export interface IX509SearchCriteria extends IPaginationSortingDto {
  keyType: string;
  status: string;
}

export interface IX509ImportCertificateOptionsDto {
  /*
        X.509 certificate in base64 string format
    */
  certificate: string;

  /*
   Private key in base64 string format
   */
  privateKey?: string;

  keyType: KeyType;
}

export interface x509CertificateDecodeDto {
  certificate: string;
}
