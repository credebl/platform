import { VCContext } from './vc.context';
import { VCVersion, DEFAULT_VC_VERSION } from './vc.constants';

export interface CredentialShapeOptions {
  version: VCVersion;
  schemaLedgerId?: string;
  existingContext?: string | string[];
  issuer?: string | { id: string };
  credentialSubject?: any;
  issuanceDate?: string;
  validFrom?: string;
  expirationDate?: string;
  validUntil?: string;
  type?: string[];
  id?: string;
  credentialStatus?: any;
  credentialSchema?: any;
  [key: string]: any;
}

export function buildCredentialContext(existingContext: string | string[] | undefined, version: VCVersion, schemaLedgerId?: string): string[] {
  const baseContext = VCContext.getBaseContext(version);
  let contextArray: string[] = [];

  if (Array.isArray(existingContext)) {
    contextArray = [...existingContext];
  } else if (existingContext) {
    contextArray = [existingContext];
  }

  if (!contextArray.includes(baseContext)) {
    contextArray = [baseContext, ...contextArray.filter((c) => c !== baseContext)];
  }

  if ((version === 'v1' || version === 'v1.1') && schemaLedgerId && !contextArray.includes(schemaLedgerId)) {
    if (schemaLedgerId !== baseContext && !schemaLedgerId.startsWith('https://www.w3.org/')) {
      contextArray.push(schemaLedgerId);
    }
  }

  return contextArray;
}

export function mapCredentialForVersion(options: CredentialShapeOptions): any {
  const { version, schemaLedgerId, existingContext, issuer, credentialSubject, type, id, credentialStatus, credentialSchema } = options;

  const context = buildCredentialContext(existingContext, version, schemaLedgerId);
  const issuerObj = issuer
    ? typeof issuer === 'string'
      ? version === 'v2'
        ? { id: issuer }
        : issuer
      : issuer
    : undefined;

  const credential: any = {
    '@context': context,
    type: type || ['VerifiableCredential'],
    issuer: issuerObj,
    credentialSubject
  };

  if (id) {
    credential.id = id;
  }

  if (credentialStatus) {
    credential.credentialStatus = credentialStatus;
  }

  if (credentialSchema) {
    credential.credentialSchema = credentialSchema;
  }

  if (version === 'v2') {
    credential.validFrom = options.validFrom || options.issuanceDate;
    if (options.validUntil || options.expirationDate) {
      credential.validUntil = options.validUntil || options.expirationDate;
      credential.expirationDate = credential.validUntil;
    }
    if (credential.validFrom) {
      credential.issuanceDate = credential.validFrom;
    }
  } else {
    if (options.issuanceDate) {
      credential.issuanceDate = options.issuanceDate;
    }
    if (options.expirationDate) {
      credential.expirationDate = options.expirationDate;
    }
    if (options.validFrom && !credential.issuanceDate) {
      credential.issuanceDate = options.validFrom;
    }
    if (options.validUntil && !credential.expirationDate) {
      credential.expirationDate = options.validUntil;
    }
  }

  return credential;
}
