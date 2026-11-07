/**
 * Keys whose values never belong in a log line: key material, encrypted key envelopes, request bodies, headers and
 * credentials (passwords, tokens, secrets, cookies). Axios errors serialise the whole request (config.data, config.headers, request._header), and validation
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
    'request',
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'idToken',
    'secret',
    'clientSecret',
    'cookie',
    'set-cookie'
  ].map((key) => key.toLowerCase())
);

const BEARER_TOKEN = /\bBearer\s+[A-Z0-9\-._~+/]+=*/gi;
const PEM_BEGIN = '-----BEGIN ';
const PEM_END = '-----END ';
const PEM_DASHES = '-----';

export const REDACTED = '[REDACTED]';

/**
 * Replaces every PEM private key block with REDACTED. A forward-only scan keeps this linear in the input length (a
 * regular expression with lazy quantifiers backtracks on many repeated BEGIN lines). A block without an END line is
 * redacted to the end of the string.
 */
function redactPemPrivateKeys(value: string): string {
  let output = '';
  let cursor = 0;

  while (cursor < value.length) {
    const begin = value.indexOf(PEM_BEGIN, cursor);
    if (-1 === begin) {
      break;
    }
    const labelEnd = value.indexOf(PEM_DASHES, begin + PEM_BEGIN.length);
    if (-1 === labelEnd) {
      break;
    }
    if (!value.slice(begin + PEM_BEGIN.length, labelEnd).endsWith('PRIVATE KEY')) {
      output += value.slice(cursor, labelEnd + PEM_DASHES.length);
      cursor = labelEnd + PEM_DASHES.length;
      continue;
    }

    output += value.slice(cursor, begin) + REDACTED;
    const end = value.indexOf(PEM_END, labelEnd + PEM_DASHES.length);
    const endLabelEnd = -1 === end ? -1 : value.indexOf(PEM_DASHES, end + PEM_END.length);
    cursor = -1 === endLabelEnd ? value.length : endLabelEnd + PEM_DASHES.length;
  }

  return output + value.slice(cursor);
}

function scrubString(value: string): string {
  return redactPemPrivateKeys(value).replace(BEARER_TOKEN, `Bearer ${REDACTED}`);
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
    // JSON.stringify returns undefined for undefined, functions and symbols.
    return JSON.stringify(redactForLog(error)) ?? typeof error;
  } catch {
    return '[Unserialisable error]';
  }
}
