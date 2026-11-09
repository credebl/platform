import { BadRequestException } from '@nestjs/common';

const PLAINTEXT_KEY_IMPORT_DISABLED =
  'Plaintext private key import is disabled. Request a key import session and send the encryptedKey envelope instead.';

function isPlaintextImportAllowed(): boolean {
  return ['1', 'true', 'yes', 'on'].includes((process.env.ALLOW_PLAINTEXT_KEY_IMPORT ?? '').trim().toLowerCase());
}

/**
 * Plaintext key material must never reach NATS, the downstream services or the agent logs. Reject it at the edge
 * unless the explicit migration escape hatch (`ALLOW_PLAINTEXT_KEY_IMPORT`) is enabled. The agent enforces the same
 * rule, so enabling the flag on only one side still fails closed.
 */
export function assertNoPlaintextKeyMaterial(payload: {
  privateKey?: unknown;
  privateKeyJwk?: unknown;
  passphrase?: unknown;
  privatekey?: unknown;
}): void {
  if (isPlaintextImportAllowed()) {
    return;
  }
  if (payload.privateKey || payload.privateKeyJwk || payload.passphrase || payload.privatekey) {
    throw new BadRequestException(PLAINTEXT_KEY_IMPORT_DISABLED);
  }
}

/** True when the migration escape hatch allows plaintext key material, so the envelope is not mandatory. */
export function isPlaintextKeyImportAllowed(): boolean {
  return isPlaintextImportAllowed();
}
