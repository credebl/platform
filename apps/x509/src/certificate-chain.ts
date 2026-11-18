import { X509Certificate } from 'node:crypto';
import { UnprocessableEntityException } from '@nestjs/common';

const PEM_BLOCK = /-----BEGIN CERTIFICATE-----([\s\S]*?)-----END CERTIFICATE-----/g;

/** PEM text or base64 DER (the form the agent returns) to DER bytes. */
function toDer(input: string): Buffer {
  const text = input.trim();
  const blocks = Array.from(text.matchAll(PEM_BLOCK));
  const body = 0 < blocks.length ? blocks[0][1] : text;
  return Buffer.from(body.replace(/\s+/g, ''), 'base64');
}

function parse(input: string, position: number): X509Certificate {
  try {
    return new X509Certificate(toDer(input));
  } catch {
    throw new UnprocessableEntityException(`certificateChain[${position}] is not a valid X.509 certificate`);
  }
}

/**
 * Checks the chain that follows an imported certificate and returns it as base64 DER. The certificate itself is the
 * first of the chain: each certificate must have been issued by, and signed with the key of, the next one. A
 * certificate that is not part of that order would otherwise only fail later, when a holder rejects a credential.
 *
 * @param leafBase64 the imported certificate, base64 DER
 * @param chain the certificates after it, PEM or base64 DER
 */
export function validateCertificateChain(leafBase64: string, chain: string[] = []): string[] {
  const certificates = [parse(leafBase64, -1), ...chain.map((certificate, index) => parse(certificate, index))];

  for (let index = 0; index < certificates.length - 1; index += 1) {
    const issuer = certificates[index + 1];
    if (!certificates[index].checkIssued(issuer) || !certificates[index].verify(issuer.publicKey)) {
      const subject = 0 === index ? 'The certificate' : `certificateChain[${index - 1}]`;
      throw new UnprocessableEntityException(
        `${subject} was not issued by certificateChain[${index}]. List the chain in order: each certificate must be issued by the next one, with the root last.`
      );
    }
  }

  return chain.map((certificate) => toDer(certificate).toString('base64'));
}
