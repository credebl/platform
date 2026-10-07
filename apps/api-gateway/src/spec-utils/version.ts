/**
 * Shared semver helpers for the dependency regression specs.
 *
 * Kept in one place so `dependency-integrity.spec.ts` and
 * `dependency-security.spec.ts` do not duplicate the same comparison logic
 * (SonarCloud new-code duplication).
 */
export const toTuple = (value: string): number[] =>
  value
    .trim()
    .split('.')
    .map((part) => parseInt(part, 10))
    .map((n) => (Number.isNaN(n) ? 0 : n));

export function cmp(a: number[], b: number[]): number {
  for (let index = 0; 3 > index; index += 1) {
    if ((a[index] ?? 0) !== (b[index] ?? 0)) {
      return (a[index] ?? 0) - (b[index] ?? 0);
    }
  }
  return 0;
}

export const satisfiesMin = (version: string, minimum: string): boolean => 0 <= cmp(toTuple(version), toTuple(minimum));
