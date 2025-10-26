import { Prisma, SignerOption } from '@prisma/client';
import { Display } from './oid4vc-issuance.interfaces';
import { CredentialFormat } from '@credebl/enum/enum';

export interface CredentialAttribute {
  mandatory?: boolean;
  value_type: string;
  display?: Display[];
}

export interface CreateCredentialTemplate {
  name: string;
  description?: string;
  signerOption?: SignerOption; //SignerOption;
  format: CredentialFormat;
  issuer: string;
  canBeRevoked: boolean;
  attributes: Prisma.JsonValue;
  appearance?: Prisma.JsonValue;
  issuerId: string;
  vct?: string;
  doctype?: string;
}

export interface UpdateCredentialTemplate extends Partial<CreateCredentialTemplate> {}
