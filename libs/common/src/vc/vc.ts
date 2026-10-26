export const VC_CONTEXT_V1 = 'https://www.w3.org/2018/credentials/v1';
export const VC_CONTEXT_V2 = 'https://www.w3.org/ns/credentials/v2';

export const SUPPORTED_VC_VERSIONS = ['v1', 'v1.1', 'v2'] as const;
export type VCVersion = (typeof SUPPORTED_VC_VERSIONS)[number];

export const DEFAULT_VC_VERSION: VCVersion = 'v1.1';

export type CredentialSubject = Record<string, unknown> | Record<string, unknown>[];

export class VCContext {
  static getBaseContext(version: VCVersion): string {
    if ('v2' === version) {
      return VC_CONTEXT_V2;
    }
    return VC_CONTEXT_V1;
  }

  static isV2Context(context: string | string[] | undefined): boolean {
    if (!context) {
      return false;
    }
    const contexts = Array.isArray(context) ? context : [context];
    return contexts.includes(VC_CONTEXT_V2);
  }

  static detectVersionFromContext(context: string | string[] | undefined): VCVersion {
    if (this.isV2Context(context)) {
      return 'v2';
    }
    return 'v1.1';
  }
}

export interface CredentialShapeOptions {
  version: VCVersion;
  schemaLedgerId?: string;
  existingContext?: string | string[];
  issuer?: string | { id: string };
  credentialSubject?: CredentialSubject;
  issuanceDate?: string;
  validFrom?: string;
  expirationDate?: string;
  validUntil?: string;
  type?: string[];
  id?: string;
  credentialStatus?: unknown;
  credentialSchema?: unknown;
  [key: string]: unknown;
}

export function buildCredentialContext(
  existingContext: string | string[] | undefined,
  version: VCVersion,
  schemaLedgerId?: string
): string[] {
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

  if (('v1' === version || 'v1.1' === version) && schemaLedgerId && !contextArray.includes(schemaLedgerId)) {
    if (schemaLedgerId !== baseContext && !schemaLedgerId.startsWith('https://www.w3.org/')) {
      contextArray.push(schemaLedgerId);
    }
  }

  return contextArray;
}

export function mapCredentialForVersion(options: CredentialShapeOptions): Record<string, unknown> {
  const {
    version,
    schemaLedgerId,
    existingContext,
    issuer,
    credentialSubject,
    type,
    id,
    credentialStatus,
    credentialSchema
  } = options;

  const context = buildCredentialContext(existingContext, version, schemaLedgerId);
  const issuerObj = issuer
    ? 'string' === typeof issuer
      ? 'v2' === version
        ? { id: issuer }
        : issuer
      : issuer
    : undefined;

  const credential: Record<string, unknown> = {
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

  if ('v2' === version) {
    const validFrom = options.validFrom || options.issuanceDate;
    credential.validFrom = validFrom;

    const validUntil = options.validUntil || options.expirationDate;
    if (validUntil) {
      credential.validUntil = validUntil;
      credential.expirationDate = validUntil;
    }

    if (validFrom) {
      credential.issuanceDate = validFrom;
    }
  } else {
    if (options.issuanceDate) {
      credential.issuanceDate = options.issuanceDate;
    }
    if (options.expirationDate) {
      credential.expirationDate = options.expirationDate;
    }
    if (options.validFrom && !options.issuanceDate) {
      credential.issuanceDate = options.validFrom;
    }
    if (options.validUntil && !options.expirationDate) {
      credential.expirationDate = options.validUntil;
    }
  }

  return credential;
}
