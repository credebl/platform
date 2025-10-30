import { Prisma, SignerOption } from '@prisma/client';
import { AttributeType, CredentialFormat } from '@credebl/enum/enum';
export interface SdJwtTemplate {
  vct: string;
  attributes: CredentialAttribute[];
}

export interface MdocTemplate {
  doctype: string;
  namespaces: {
    namespace: string;
    attributes: CredentialAttribute[];
  }[];
}

export interface CreateCredentialTemplate {
  name: string;
  description?: string;
  signerOption?: SignerOption;
  format: CredentialFormat;
  canBeRevoked: boolean;
  appearance?: Prisma.JsonValue;
  issuerId: string;
  template: SdJwtTemplate | MdocTemplate;
}

export interface UpdateCredentialTemplate extends Partial<CreateCredentialTemplate> {}

export interface ClaimDisplay {
  name: string;
  locale?: string;
}

export interface Claim {
  path?: string[];
  display?: ClaimDisplay[];
  mandatory?: boolean;
}

export interface CredentialAttribute {
  key: string;
  mandatory?: boolean;
  value_type: AttributeType;
  disclose?: boolean;
  children?: CredentialAttribute[];
  display?: ClaimDisplay[];
}
