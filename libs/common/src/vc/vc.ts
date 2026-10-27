export const VC_CONTEXT_V1 = 'https://www.w3.org/2018/credentials/v1';
export const VC_CONTEXT_V2 = 'https://www.w3.org/ns/credentials/v2';

export const SUPPORTED_VC_VERSIONS = ['v1', 'v1.1', 'v2'] as const;
export type VCVersion = (typeof SUPPORTED_VC_VERSIONS)[number];

export const DEFAULT_VC_VERSION: VCVersion = 'v1.1';

export type CredentialSubject = Record<string, unknown> | Record<string, unknown>[];

/** JSON-LD allows context entries to be plain strings or inline context objects. */
export type CredentialContextValue = string | (string | Record<string, unknown>)[];

/**
 * Minimal credential shape needed to build/normalise a credential.
 * Kept structural on purpose so both gateway DTOs and microservice interfaces can use it.
 */
export interface VersionedCredentialLike {
  '@context'?: CredentialContextValue;
  type?: string[];
  issuer?: string | { id?: unknown };
  issuanceDate?: string;
  expirationDate?: string;
  validFrom?: string;
  validUntil?: string;
  credentialSubject?: CredentialSubject;
  credentialStatus?: unknown;
  credentialSchema?: unknown;
  id?: string;
  [key: string]: unknown;
}

export interface CredentialShapeOptions {
  version: VCVersion;
  schemaLedgerId?: string;
  existingContext?: CredentialContextValue;
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

function toContextArray(context: CredentialContextValue | undefined): (string | Record<string, unknown>)[] {
  if (Array.isArray(context)) {
    return context;
  }
  return context ? [context] : [];
}

/**
 * Exact membership check for JSON-LD context entries.
 *
 * Uses strict equality on purpose: `Array.prototype.includes` makes CodeQL report
 * incomplete URL substring sanitisation for the W3C context URLs below.
 */
function hasContextValue(contexts: (string | Record<string, unknown>)[], expected: string): boolean {
  return contexts.some((context) => context === expected);
}

function getCredentialSchemaId(credentialSchema: unknown): string | undefined {
  if (!credentialSchema || 'object' !== typeof credentialSchema || Array.isArray(credentialSchema)) {
    return undefined;
  }

  const { id } = credentialSchema as { id?: unknown };
  return 'string' === typeof id ? id : undefined;
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function toDateOnly(value: string): string {
  return value.split('T')[0];
}

function isPastOrToday(value: string, now: Date): boolean {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }
  return parsed.getTime() <= now.getTime();
}

export class VCContext {
  static getBaseContext(version: VCVersion): string {
    if ('v2' === version) {
      return VC_CONTEXT_V2;
    }
    return VC_CONTEXT_V1;
  }

  static isV2Context(context: CredentialContextValue | undefined): boolean {
    return hasContextValue(toContextArray(context), VC_CONTEXT_V2);
  }

  static detectVersionFromContext(context: CredentialContextValue | undefined): VCVersion {
    if (this.isV2Context(context)) {
      return 'v2';
    }
    return 'v1.1';
  }
}

/**
 * `v1` and `v1.1` share the VC 1.1 data model (v1 context, `issuanceDate`), so they are interchangeable;
 * only `v2` uses the VC 2.0 data model.
 */
export function isSameDataModel(a: VCVersion, b: VCVersion): boolean {
  return ('v2' === a) === ('v2' === b);
}

/**
 * Resolves the VC version of a stored JSON-LD credential template.
 *
 * Templates created before `vcVersion` existed only carry a context (or nothing at all), so the
 * version falls back to the one implied by the context and finally to the v1.1 default.
 */
export function getTemplateVcVersion(
  template: { vcVersion?: VCVersion; context?: CredentialContextValue } | undefined
): VCVersion {
  if (template?.vcVersion) {
    return template.vcVersion;
  }
  return toContextArray(template?.context).length
    ? VCContext.detectVersionFromContext(template?.context)
    : DEFAULT_VC_VERSION;
}

/**
 * Builds an ordered `@context` array for the requested credential version.
 *
 * - The version base context is always first.
 * - The base context of the other version is dropped so a credential never mixes 1.1 and 2.0.
 * - The schema URL/id is kept for every version so downstream schema resolution keeps working.
 */
export function buildCredentialContext(
  existingContext: CredentialContextValue | undefined,
  version: VCVersion,
  schemaLedgerId?: string
): string[] {
  const baseContext = VCContext.getBaseContext(version);
  const conflictingContext = 'v2' === version ? VC_CONTEXT_V1 : VC_CONTEXT_V2;

  const contextArray = toContextArray(existingContext).filter(
    (context): context is string => 'string' === typeof context && context !== baseContext && context !== conflictingContext
  );

  const isUsableSchemaReference =
    schemaLedgerId &&
    schemaLedgerId !== baseContext &&
    !schemaLedgerId.startsWith('https://www.w3.org/') &&
    !contextArray.includes(schemaLedgerId);

  return isUsableSchemaReference ? [baseContext, ...contextArray, schemaLedgerId] : [baseContext, ...contextArray];
}

/**
 * Maps a credential to the field names of the requested version.
 *
 * VC 2.0 uses `validFrom`/`validUntil` and no longer defines `issuanceDate`/`expirationDate`,
 * so the fields of the other version are never emitted.
 */
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
    const validFrom = options.validFrom ?? options.issuanceDate;
    if (validFrom) {
      credential.validFrom = validFrom;
    }

    const validUntil = options.validUntil ?? options.expirationDate;
    if (validUntil) {
      credential.validUntil = validUntil;
    }
  } else {
    const issuanceDate = options.issuanceDate ?? options.validFrom;
    if (issuanceDate) {
      credential.issuanceDate = issuanceDate;
    }

    const expirationDate = options.expirationDate ?? options.validUntil;
    if (expirationDate) {
      credential.expirationDate = expirationDate;
    }
  }

  return credential;
}

/**
 * Lists the reasons why a credential does not match the requested VC version.
 * An empty list means the credential is consistent with the requested version.
 */
export function getCredentialVersionProblems(
  credential: VersionedCredentialLike | undefined,
  version: VCVersion
): string[] {
  if (!credential) {
    return [];
  }

  const problems: string[] = [];
  const contexts = toContextArray(credential['@context']);

  if (!contexts.length) {
    problems.push('@context is required');
    return problems;
  }

  if ('v2' === version) {
    if (!hasContextValue(contexts, VC_CONTEXT_V2)) {
      problems.push(`@context must include ${VC_CONTEXT_V2} for VC 2.0`);
    }
    if (credential.issuanceDate) {
      problems.push('issuanceDate is not part of VC 2.0, use validFrom instead');
    }
    if (credential.expirationDate) {
      problems.push('expirationDate is not part of VC 2.0, use validUntil instead');
    }
  } else {
    if (!hasContextValue(contexts, VC_CONTEXT_V1)) {
      problems.push(`@context must include ${VC_CONTEXT_V1} for VC 1.1`);
    }
    if (!credential.issuanceDate) {
      problems.push('issuanceDate is required for VC 1.1');
    }
  }

  return problems;
}

/**
 * Resolves the schema reference (schema URL or ledger schema id) from a credential.
 *
 * VC 2.0 credentials may declare the schema through `credentialSchema` or keep the schema URL in
 * `@context`; relying on `@context[1]` breaks as soon as the base context is not at index 0.
 */
export function resolveSchemaReference(credential: VersionedCredentialLike | undefined): string | undefined {
  if (!credential) {
    return undefined;
  }

  const credentialSchemaId = getCredentialSchemaId(credential.credentialSchema);

  if (credentialSchemaId && isHttpUrl(credentialSchemaId)) {
    return credentialSchemaId;
  }

  const contextEntries = toContextArray(credential['@context']).filter(
    (context): context is string => 'string' === typeof context && !context.startsWith('https://www.w3.org/')
  );

  return contextEntries.find(isHttpUrl) ?? contextEntries[0] ?? credentialSchemaId;
}

/**
 * Returns a copy of the credential with the validity dates of the requested version.
 *
 * Past start dates are refreshed to "now" (the original behaviour for re-used offers), while
 * future start dates are preserved so a credential that is not valid yet is not silently made
 * valid today.
 */
export function withRefreshedValidityDates<T extends VersionedCredentialLike>(
  credential: T,
  version: VCVersion,
  now: Date = new Date()
): T {
  const start = credential.validFrom ?? credential.issuanceDate;
  const end = credential.validUntil ?? credential.expirationDate;

  const refreshed: VersionedCredentialLike = { ...credential };
  delete refreshed.issuanceDate;
  delete refreshed.expirationDate;
  delete refreshed.validFrom;
  delete refreshed.validUntil;

  if (start) {
    const shouldRefresh = isPastOrToday(start, now) && toDateOnly(start) !== toDateOnly(now.toISOString());
    const value = shouldRefresh ? now.toISOString() : start;
    refreshed['v2' === version ? 'validFrom' : 'issuanceDate'] = value;
  }

  if (end) {
    refreshed['v2' === version ? 'validUntil' : 'expirationDate'] = end;
  }

  return refreshed as T;
}
