import { SignerOption } from '@credebl/prisma/client';

export interface CreateVerificationTemplate {
  name: string;
  templateJson: object;
  signerOption?: SignerOption;
}

export interface UpdateVerificationTemplate extends Partial<CreateVerificationTemplate> {}
