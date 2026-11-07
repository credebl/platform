/**
 * Keys whose values never belong in a log line: key material, encrypted key envelopes, request bodies, headers and
 * credentials. Axios errors serialise the whole request (config.data, config.headers, request._header), and validation
 * errors echo the rejected `value`, so all of them are dropped wherever they appear.
 */
const SENSITIVE_KEYS = new Set(
  [
    'privateKey',
    'privateKeyJwk',
    'privatekey',
    'passphrase',
    'seed',
    'encryptedKey',
    'jwe',
    'data',
    'value',
    'headers',
    '_header',
    'authorization',
    'apiKey',
    'request'
  ].map((key) => key.toLowerCase())
);

const PEM_PRIVATE_KEY = /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z0-9 ]*PRIVATE KEY-----/g;
const BEARER_TOKEN = /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/gi;

export const REDACTED = '[REDACTED]';

function scrubString(value: string): string {
  return value.replace(PEM_PRIVATE_KEY, REDACTED).replace(BEARER_TOKEN, `Bearer ${REDACTED}`);
}

/**
 * Returns a copy of `error` that is safe to log: sensitive keys are replaced at any depth, PEM private keys and bearer
 * tokens are removed from strings, and circular references are cut. Stack traces are not included.
 */
export function redactForLog(error: unknown): unknown {
  const seen = new WeakSet<object>();

  const scrub = (input: unknown): unknown => {
    if ('string' === typeof input) {
      return scrubString(input);
    }
    if (!input || 'object' !== typeof input) {
      return input;
    }
    if (seen.has(input)) {
      return '[Circular]';
    }
    seen.add(input);
    if (Array.isArray(input)) {
      return input.map(scrub);
    }

    // Axios errors expose a trimmed toJSON(); everything else is read from its own enumerable properties.
    const serialised =
      'function' === typeof (input as { toJSON?: unknown }).toJSON
        ? (input as { toJSON: () => unknown }).toJSON()
        : input;
    if (!serialised || 'object' !== typeof serialised) {
      return scrub(serialised);
    }

    const source =
      input instanceof Error
        ? { name: input.name, message: input.message, ...(serialised as Record<string, unknown>) }
        : (serialised as Record<string, unknown>);
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(source)) {
      output[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? REDACTED : scrub(entry);
    }
    return output;
  };

  try {
    return scrub(error);
  } catch {
    return '[Unserialisable error]';
  }
}

/** `JSON.stringify(redactForLog(error))`, for log lines. */
export function stringifyForLog(error: unknown): string {
  try {
    return JSON.stringify(redactForLog(error)) ?? String(error);
  } catch {
    return '[Unserialisable error]';
  }
}
