import { X509Certificate } from 'node:crypto';

/** The namespace and claim an mDL carries its issuing country in (ISO/IEC 18013-5). */
const ISSUING_COUNTRY = 'issuing_country';

/** The country (C) of a certificate given as base64 DER, or undefined when it has none or cannot be read. */
export function countryOfCertificate(certificateBase64: string): string | undefined {
  try {
    const { subject } = new X509Certificate(Buffer.from(certificateBase64, 'base64'));
    return subject
      .split('\n')
      .find((line) => line.startsWith('C='))
      ?.slice('C='.length);
  } catch {
    return undefined;
  }
}

/** Every `issuing_country` value of the namespaces of an mDoc payload, with the namespace it was found in. */
function issuingCountries(payload: Record<string, unknown>): { namespace: string; country: string }[] {
  const namespaces = payload?.namespaces;
  if (!namespaces || 'object' !== typeof namespaces) {
    return [];
  }
  return Object.entries(namespaces as Record<string, unknown>)
    .filter(([, claims]) => claims && 'object' === typeof claims && ISSUING_COUNTRY in (claims as object))
    .map(([namespace, claims]) => ({
      namespace,
      country: String((claims as Record<string, unknown>)[ISSUING_COUNTRY])
    }));
}

/**
 * Problems an mDoc would run into when a wallet validates it, found before an offer is created. A wallet checks that
 * the signing certificate carries a country and that it equals the credential's issuing country; an offer that
 * breaks either is issued, rejected by the wallet and can then no longer be redeemed.
 *
 * @returns the problems, in plain language; empty when there are none
 */
export function checkMdocIssuance(certificateBase64: string, payload: Record<string, unknown>): string[] {
  const problems: string[] = [];
  const certificateCountry = countryOfCertificate(certificateBase64);
  const claimed = issuingCountries(payload);

  if (!certificateCountry) {
    problems.push(
      'The signing certificate has no country (C) in its subject, which wallets require for an mDoc. Import or create a certificate with a country.'
    );
    return problems;
  }

  for (const { namespace, country } of claimed) {
    if (country !== certificateCountry) {
      problems.push(
        `issuing_country in ${namespace} is "${country}" but the signing certificate's country is "${certificateCountry}". They must match.`
      );
    }
  }
  return problems;
}
