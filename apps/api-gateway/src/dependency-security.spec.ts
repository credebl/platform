import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { satisfiesMin, toTuple } from './spec-utils/version';

const root = process.cwd();
const read = (rel: string): string => readFileSync(join(root, rel), 'utf8');

/**
 * Security regression guard for the #1730 / #1750 remediation work.
 *
 * Guards two things:
 *   1. Dead, exploit-carrying packages (removed in P0) never come back into
 *      the production dependency graph.
 *   2. No resolved copy of any package protected by P0/P1/P2 drops below the
 *      patched minimum version — i.e. a future `pnpm install` that would
 *      re-introduce a vulnerable transitive copy fails CI.
 *
 * The assertions are lockfile-based so they are deterministic and do not
 * require a network call to the npm advisory database at test time (assuming
 * the lockfile is committed; `pnpm install --frozen-lockfile` keeps it in sync).
 */

interface PkgKey {
  name: string;
  version: string;
}

/** Extract `name@semver` package keys from the lockfile's `packages:`/`snapshots:` sections. */
function lockfilePackages(lockfile: string): PkgKey[] {
  const keys: PkgKey[] = [];
  // Handles both plain (`name@1.2.3:`) and quoted scoped (`'@scope/name@1.2.3':`) keys.
  const linePattern = /^\s{2}'?((?:@[^@\s'"/]+\/)?[^@\s'"/]+)'?@(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)(?=[\s(':])/;
  for (const raw of lockfile.split('\n')) {
    const match = linePattern.exec(raw);
    if (match) {
      keys.push({ name: match[1] as string, version: match[2] as string });
    }
  }
  return keys;
}

/**
 * Minimum patched version for every package protected by the P0/P1 overrides
 * and the P2 major bumps. Any resolved copy below this is a regression and
 * must fail the build.
 */
const MIN_PATCHED: Record<string, string> = {
  axios: '1.20.0',
  ws: '8.21.2',
  'proxy-addr': '2.0.8',
  'engine.io': '6.6.10',
  '@fastify/busboy': '3.2.2',
  multer: '2.4.0',
  qs: '6.16.0',
  handlebars: '4.7.9',
  'websocket-driver': '0.7.5',
  'fast-uri': '3.1.6',
  'brace-expansion': '2.1.7',
  moment: '2.31.0',
  'fast-xml-parser': '5.10.1',
  'ip-address': '10.7.1',
  'basic-ftp': '6.2.1',
  '@grpc/grpc-js': '1.14.5',
  'tar-fs': '3.1.3',
  minimatch: '9.0.7',
  uuid: '11.1.1',
  nodemailer: '10.0.9',
  '@opentelemetry/core': '2.8.0',
  '@nestjs/microservices': '11.2.5'
};

/** js-yaml is allowed at the patched minimum per major line (4.x and 5.x both ship). */
const MIN_PATCHED_MAJORS: Record<string, Record<string, string>> = {
  'js-yaml': { '4': '4.3.2', '5': '5.4.1' }
};

/** Packages removed in P0 that must never return (dead code, no fixes upstream). */
const REMOVED_PACKAGES = [
  'html-pdf',
  'phantomjs-prebuilt',
  'request',
  'node-html-to-image',
  'puppeteer',
  'puppeteer-core',
  'pdfkit',
  'blob-stream',
  '@types/pdfkit',
  'node-forge'
];

describe('dependency security — no regression after P0/P1 remediation', () => {
  const packageJson = JSON.parse(read('package.json')) as {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    pnpm?: { overrides?: Record<string, string> };
  };
  const packages = lockfilePackages(read('pnpm-lock.yaml'));

  it('parses quoted scoped package keys so they are actually inspected', () => {
    const fixture = `
lockfileVersion: '9.0'
packages:
  '@fastify/busboy@3.2.2':
    resolution: {integrity: sha512-aaa}
  '@grpc/grpc-js@1.14.5':
    resolution: {integrity: sha512-bbb}
  '@nestjs/microservices@11.2.7(@grpc/grpc-js@1.14.5)':
    resolution: {integrity: sha512-ccc}
  axios@1.20.0:
    resolution: {integrity: sha512-ddd}
`;
    const parsed = lockfilePackages(fixture);
    expect(parsed).toEqual(
      expect.arrayContaining([
        { name: '@fastify/busboy', version: '3.2.2' },
        { name: '@grpc/grpc-js', version: '1.14.5' },
        { name: '@nestjs/microservices', version: '11.2.7' },
        { name: 'axios', version: '1.20.0' }
      ])
    );
  });

  it('removed dead dependencies are absent from package.json', () => {
    const declared = { ...packageJson.dependencies, ...packageJson.devDependencies };
    for (const pkg of REMOVED_PACKAGES) {
      expect(declared).not.toHaveProperty(pkg);
    }
  });

  it('removed dead dependencies and their deprecated root are absent from the lockfile', () => {
    const resolvedNames = new Set(packages.map((entry) => entry.name));
    for (const pkg of REMOVED_PACKAGES) {
      expect(resolvedNames.has(pkg)).toBe(false);
    }
  });

  it('every patched override target is still declared in pnpm.overrides', () => {
    const overrides = packageJson.pnpm?.overrides ?? {};
    const expected: string[] = [
      'axios@<1.0.0',
      'ws@<8.21.2',
      'proxy-addr@<2.0.8',
      'engine.io@<6.6.10',
      '@fastify/busboy@<3.2.2',
      'multer@<2.4.0',
      'qs@<6.16.0',
      'ip-address@<=10.7.0',
      'brace-expansion@2',
      'moment@<2.31.0',
      'fast-xml-parser@<5.10.1',
      'basic-ftp@<6.2.1',
      '@grpc/grpc-js@<1.14.5',
      'uuid@<11.1.1'
    ];
    for (const key of expected) {
      expect(overrides).toHaveProperty([key]);
    }
  });

  it.each(Object.keys(MIN_PATCHED))('no resolved copy of %s is below the patched minimum', (pkg) => {
    const minimum = MIN_PATCHED[pkg] as string;
    const copies = packages.filter((entry) => entry.name === pkg);
    if (0 === copies.length) {
      return; // package legitimately resolved out of the tree (e.g. ip-address)
    }
    for (const copy of copies) {
      expect(satisfiesMin(copy.version, minimum)).toBe(true);
    }
  });

  it.each(Object.keys(MIN_PATCHED_MAJORS))('no resolved copy of %s is below its per-major patched minimum', (pkg) => {
    const byMajor = MIN_PATCHED_MAJORS[pkg] as Record<string, string>;
    const copies = packages.filter((entry) => entry.name === pkg);
    for (const copy of copies) {
      const major = toTuple(copy.version)[0].toString();
      const minimum = byMajor[major];
      expect(minimum).toBeDefined();
      expect(satisfiesMin(copy.version, minimum)).toBe(true);
    }
  });
});
