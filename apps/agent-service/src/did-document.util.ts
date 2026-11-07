/**
 * Rewrites a JSON value with the keys of every object in sorted order, so that two documents that differ only in
 * key order serialise identically. Array order is significant and kept.
 */
export function canonicalizeJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalizeJson);
  }
  if (value && 'object' === typeof value) {
    return Object.fromEntries(
      Object.keys(value)
        .sort((a, b) => a.localeCompare(b))
        .map((key) => [key, canonicalizeJson(value[key])])
    );
  }
  return value;
}

/**
 * Compares two DID documents ignoring the order of object keys. A stored document kept as a JSON string is parsed.
 */
export function didDocumentsMatch(resolved: unknown, stored: unknown): boolean {
  const parse = (document: unknown): unknown => {
    if ('string' !== typeof document) {
      return document;
    }
    try {
      return JSON.parse(document);
    } catch {
      return document;
    }
  };

  const left = parse(resolved);
  const right = parse(stored);
  if (!left || !right) {
    return false;
  }
  return JSON.stringify(canonicalizeJson(left)) === JSON.stringify(canonicalizeJson(right));
}
