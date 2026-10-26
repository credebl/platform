import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { DEFAULT_VC_VERSION, getCredentialVersionProblems, VCVersion, VersionedCredentialLike } from '@credebl/common/vc';

type CredentialContainer = { credential?: VersionedCredentialLike };

function extractCredentials(value: unknown): VersionedCredentialLike[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => extractCredentials(entry));
  }

  if (!value || 'object' !== typeof value) {
    return [];
  }

  // The value can be a credential itself (e.g. OOB single credential) or a wrapper around it
  if ('@context' in value) {
    return [value as VersionedCredentialLike];
  }

  const { credential } = value as CredentialContainer;
  return credential ? [credential] : [];
}

function collectProblems(value: unknown, forwardedVersion?: VCVersion): string[] {
  const version = forwardedVersion ?? DEFAULT_VC_VERSION;
  return extractCredentials(value).flatMap((credential) => getCredentialVersionProblems(credential, version));
}

/**
 * Validates that every credential in the payload matches the requested VC version
 * (base `@context` and version-specific date fields).
 *
 * The requested version is read from the enclosing DTO so a single constraint can be reused
 * for create-offer, out-of-band and bulk payloads.
 */
@ValidatorConstraint({ name: 'isCredentialsVersionConsistent', async: false })
export class IsCredentialsVersionConsistentConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    return 0 === collectProblems(value, (args.object as { version?: VCVersion }).version).length;
  }

  defaultMessage(args: ValidationArguments): string {
    const problems = collectProblems(args.value, (args.object as { version?: VCVersion }).version);
    return `Credential does not match the requested VC version: ${problems.join('; ')}`;
  }
}
