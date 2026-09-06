import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

interface PkgJson {
  version: string;
}

interface Catalog {
  [pkg: string]: string;
}

function parseCatalog(yaml: string): Catalog {
  const catalog: Catalog = {};
  const lines = yaml.split('\n');
  let inCatalog = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('catalog:')) {
      inCatalog = true;
      continue;
    }
    if (!inCatalog || line.startsWith('-') || '' === line) {
      continue;
    }
    const separator = line.indexOf(':');
    if (-1 === separator) {
      continue;
    }
    const name = line.slice(0, separator).trim().replace(/^"|"$/g, '');
    const range = line.slice(separator + 1).trim();
    catalog[name] = range;
  }
  return catalog;
}

function declaredRange(pkg: string, dependencies: Record<string, string>, catalog: Catalog): string {
  const declared = dependencies[pkg];
  return 'catalog:' === declared ? (catalog[pkg] ?? declared) : declared;
}

const toTuple = (value: string): number[] =>
  value
    .trim()
    .split('.')
    .map((part) => parseInt(part, 10))
    .map((n) => (Number.isNaN(n) ? 0 : n));

function cmp(a: number[], b: number[]): number {
  for (let index = 0; 3 > index; index += 1) {
    if ((a[index] ?? 0) !== (b[index] ?? 0)) {
      return (a[index] ?? 0) - (b[index] ?? 0);
    }
  }
  return 0;
}

function caretSatisfies(version: string, range: string): boolean {
  const minimum = toTuple(range.replace(/^\^/, ''));
  const major = minimum[0] ?? 0;
  const minBound = [major, 0, 0];
  const maxBound = 0 === major ? [0, (minimum[1] ?? 0) + 1, 0] : [major + 1, 0, 0];
  const cmp = (a: number[], b: number[]): number => {
    for (let index = 0; 3 > index; index += 1) {
      if ((a[index] ?? 0) !== (b[index] ?? 0)) {
        return (a[index] ?? 0) - (b[index] ?? 0);
      }
    }
    return 0;
  };
  return 0 <= cmp(toTuple(version), minBound) && 0 > cmp(toTuple(version), maxBound);
}

describe('dependency integrity — direct dependencies resolve within declared ranges', () => {
  const root = process.cwd();
  const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const catalog = parseCatalog(readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8'));
  const dependencies: Record<string, string> = { ...packageJson.dependencies, ...packageJson.devDependencies };

  it.each(Object.keys(dependencies).sort())('resolves %s to a version matching its declared range', (pkg) => {
    const range = declaredRange(pkg, dependencies, catalog);
    const packagePath = join(root, 'node_modules', pkg, 'package.json');
    expect(existsSync(packagePath)).toBe(true);
    const installed = JSON.parse(readFileSync(packagePath, 'utf8')) as PkgJson;
    const installedVersion = installed.version.replace(/^[=\s]+/, '');

    let satisfies: boolean;
    if (range.startsWith('^')) {
      satisfies = caretSatisfies(installedVersion, range);
    } else if (range.startsWith('~')) {
      const minimum = toTuple(range.replace(/^~/, ''));
      const [major, minor] = minimum;
      const upperMinor = (minor ?? 0) + 1;
      satisfies =
        0 <= cmp(toTuple(installedVersion), minimum) && 0 > cmp(toTuple(installedVersion), [major ?? 0, upperMinor, 0]);
    } else if ('' === range) {
      satisfies = true;
    } else {
      satisfies = installedVersion === range || installedVersion.startsWith(`${range}.`);
    }
    expect(satisfies).toBe(true);
  });
});
