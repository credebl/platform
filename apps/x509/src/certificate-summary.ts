import { X509Certificate } from 'node:crypto';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(date: Date): string {
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** The common name of a certificate given as base64 DER, or undefined when it has none or cannot be read. */
function commonNameOf(certificateBase64: string): string | undefined {
  try {
    const { subject } = new X509Certificate(Buffer.from(certificateBase64, 'base64'));
    return subject
      .split('\n')
      .find((line) => line.startsWith('CN='))
      ?.slice('CN='.length);
  } catch {
    return undefined;
  }
}

/**
 * A short description of a stored certificate for a message to a person, for example
 * `ibdic.in (expires 10 Nov 2027, id a50877c5)`. The id is what a request would name; the rest is what a person
 * recognises the certificate by.
 */
export function describeCertificate(record: { id: string; certificateBase64: string; expiry: Date }): string {
  const name = commonNameOf(record.certificateBase64) ?? 'certificate';
  return `${name} (expires ${formatDate(new Date(record.expiry))}, id ${record.id.slice(0, 8)})`;
}
