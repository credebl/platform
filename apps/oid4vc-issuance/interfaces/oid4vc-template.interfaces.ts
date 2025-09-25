import { Prisma } from '@prisma/client';
import { Display } from './oid4vc-issuance.interfaces';

export interface CredentialAttribute {
  mandatory?: boolean;
  value_type: string;
  display?: Display[];
}

export enum SignerOption {
  DID = 'did',
  X509 = 'x509'
}
export interface CreateCredentialTemplate {
  name: string;
  description?: string;
  signerOption?: SignerOption;
  format: 'sd-jwt-vc' | 'mdoc';
  issuer: string;
  canBeRevoked: boolean;
  attributes: Prisma.JsonValue;
  appearance?: Prisma.JsonValue;
  issuerId: string;
}

export interface UpdateCredentialTemplate extends Partial<CreateCredentialTemplate> {}
