import { Prisma } from '@prisma/client';
import { Display } from './oidc-issuance.interfaces';

export interface CredentialAttribute {
  mandatory?: boolean;
  value_type: string;
  display?: Display[];
}

export interface CreateCredentialTemplate {
  name: string;
  description?: string;
  format: 'sd-jwt-vc' | 'mdoc';
  issuer: string;
  canBeRevoked: boolean;
  // attributes: Record<string, CredentialAttribute>
  // appearance?: Record<string, any>
  attributes: Prisma.JsonValue; // <- instead of Record<string, CredentialAttribute>
  appearance?: Prisma.JsonValue;
  issuerId: string;
}

export interface UpdateCredentialTemplate extends Partial<CreateCredentialTemplate> {}
