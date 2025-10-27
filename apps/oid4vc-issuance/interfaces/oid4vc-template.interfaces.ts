import { Prisma, SignerOption } from '@prisma/client';
import { CredentialFormat } from '@credebl/enum/enum';

// export interface CredentialAttribute {
//   mandatory?: boolean;
//   value_type: string;
//   display?: Display[];
// }

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
  signerOption?: SignerOption; //SignerOption;
  format: CredentialFormat;
  canBeRevoked: boolean;
  // attributes: Prisma.JsonValue;
  appearance?: Prisma.JsonValue;
  issuerId: string;
  // vct?: string;
  // doctype?: string;

  template: SdJwtTemplate | MdocTemplate;
}

export interface UpdateCredentialTemplate extends Partial<CreateCredentialTemplate> {}

export interface ClaimDisplay {
  name: string;
  locale?: string;
}

export interface Claim {
  path: string[];
  display?: ClaimDisplay[];
  mandatory?: boolean;
}

export interface CredentialAttribute {
  key: string;
  mandatory?: boolean;
  value_type: string;
  disclose?: boolean;
  children?: CredentialAttribute[];
  display?: ClaimDisplay[];
}
