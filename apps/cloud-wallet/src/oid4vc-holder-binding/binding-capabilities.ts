/* eslint-disable camelcase */
import { SUPPORTED_HOLDER_BINDING_METHODS } from '@credebl/enum/enum';
import { PREFERRED_DID_METHODS, PREFERRED_SIGNATURE_ALGORITHMS, RSA_SIGNATURE_ALGORITHMS } from './binding.constants';
import {
  CredentialConfigurationMetadata,
  HolderBindingCapabilities,
  ResolvedOfferMetadata,
  WalletBindingCapabilitiesInput
} from './binding.types';

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function orderByPreference(values: readonly string[], preferred: readonly string[]): string[] {
  const available = new Set(values);
  const preferredValues = preferred.filter((value) => available.has(value));
  return [...preferredValues, ...values.filter((value) => !preferred.includes(value))];
}

/** `undefined` means the issuer gave no restriction; an empty array means no common value. */
function intersectAdvertised(lists: readonly (readonly string[] | undefined)[]): string[] | undefined {
  const advertised = lists.filter((list): list is readonly string[] => undefined !== list);
  if (0 === advertised.length) {
    return undefined;
  }
  return advertised[0].filter((value) => advertised.every((list) => list.includes(value)));
}

function orderWithin(values: readonly string[], available: readonly string[], preferred: readonly string[]): string[] {
  return orderByPreference(
    values.filter((value) => available.includes(value)),
    preferred
  );
}

function configurations(offer?: ResolvedOfferMetadata): CredentialConfigurationMetadata[] {
  if (!offer) {
    return [];
  }
  const byConfig = offer.credential_configurations_supported ?? offer.credentialConfigurationsSupported ?? {};
  return Object.values(byConfig);
}

function issuerDidMethods(configs: readonly CredentialConfigurationMetadata[]): string[] | undefined {
  return intersectAdvertised(
    configs.map(
      (config) => config.cryptographic_binding_methods_supported ?? config.cryptographicBindingMethodsSupported
    )
  );
}

function issuerSignatureAlgorithms(configs: readonly CredentialConfigurationMetadata[]): string[] | undefined {
  return intersectAdvertised(
    configs.map((config) => config.proof_types_supported?.jwt?.proof_signing_alg_values_supported)
  );
}

/**
 * The KMS is the ultimate restriction on key creation: it can narrow, but never widen, the
 * algorithms advertised by the wallet's other capability sources. No KMS list means the wallet
 * fallback order; an explicitly empty KMS list means no algorithm is available.
 */
function walletAlgorithms(wallet: WalletBindingCapabilitiesInput): string[] {
  const { kmsAlgorithms, signatureAlgorithms, proofSigningAlgValuesSupported } = wallet;
  if (undefined === kmsAlgorithms) {
    const advertised = unique([...(signatureAlgorithms ?? []), ...(proofSigningAlgValuesSupported ?? [])]);
    return 0 === advertised.length ? [...PREFERRED_SIGNATURE_ALGORITHMS] : advertised;
  }

  const kms = unique(kmsAlgorithms);
  if (undefined === signatureAlgorithms && undefined === proofSigningAlgValuesSupported) {
    return kms;
  }
  const advertised = unique([...(signatureAlgorithms ?? []), ...(proofSigningAlgValuesSupported ?? [])]);
  return kms.filter((algorithm) => advertised.includes(algorithm));
}

/**
 * Narrow the issuer's advertised binding methods and proof algorithms to what this wallet can use.
 * An issuer that advertises nothing falls back to the wallet preference order (spec 6.2).
 */
export function deriveBindingCapabilities(
  offer: ResolvedOfferMetadata | undefined,
  wallet: WalletBindingCapabilitiesInput
): HolderBindingCapabilities {
  const configs = configurations(offer);
  const credentialFormats = unique(
    configs.map((config) => config.format).filter((format): format is string => 'string' === typeof format)
  );

  const supportedMethods: readonly string[] = SUPPORTED_HOLDER_BINDING_METHODS;
  const walletDidMethods = unique(wallet.didMethods ?? []).filter((method) => supportedMethods.includes(method));
  // An explicitly supplied list is authoritative, even when none of its entries are supported.
  const availableDidMethods =
    undefined === wallet.didMethods ? [...SUPPORTED_HOLDER_BINDING_METHODS] : walletDidMethods;
  const supportsAll = true === offer?.supportsAllDidMethods || true === offer?.supports_all_did_methods;
  const advertisedDidMethods = supportsAll ? availableDidMethods : issuerDidMethods(configs);
  let didMethods = orderWithin(advertisedDidMethods ?? availableDidMethods, availableDidMethods, PREFERRED_DID_METHODS);

  // Credo rejects plain JWK binding for W3C LDP credentials; only DID methods are offered there.
  if (credentialFormats.includes('ldp_vc')) {
    didMethods = didMethods.filter((method) => 'jwk' !== method);
  }

  const availableAlgorithms = walletAlgorithms(wallet);
  const signatureAlgorithms = orderWithin(
    issuerSignatureAlgorithms(configs) ?? availableAlgorithms,
    availableAlgorithms,
    PREFERRED_SIGNATURE_ALGORITHMS
  );

  return { didMethods, signatureAlgorithms, credentialFormats };
}

/** `did:key` cannot encode RSA keys; do not offer RSA algorithms once that method is selected. */
export function algorithmsForDidMethod(method: string | undefined, algorithms: readonly string[]): string[] {
  if ('did:key' === method) {
    return algorithms.filter((algorithm) => !(RSA_SIGNATURE_ALGORITHMS as readonly string[]).includes(algorithm));
  }
  return [...algorithms];
}

export function isDidMethodSupported(capabilities: HolderBindingCapabilities, method?: string): boolean {
  return 'string' === typeof method && capabilities.didMethods.includes(method);
}

export function isSignatureAlgorithmSupported(capabilities: HolderBindingCapabilities, algorithm?: string): boolean {
  return 'string' === typeof algorithm && capabilities.signatureAlgorithms.includes(algorithm);
}
