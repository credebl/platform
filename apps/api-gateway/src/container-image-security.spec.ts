import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

/**
 * Container-image regression guard for the #1730 / #1750 remediation work (P3).
 *
 * The runtime OS packages (musl, zlib, openssl) and the Node toolchain are
 * inherited from the base image. Pinning the base to an immutable digest keeps
 * the patched Alpine layer (and prevents the mutable tag from silently rolling
 * to an unpatched or broken rebuild), while the unpinned `nats` images in the
 * compose files are pinned to a fixed server version.
 */
const PINNED_BASE = 'node:24-alpine3.24@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1';

const dockerfilesDir = join(root, 'Dockerfiles');
const read = (rel: string): string => readFileSync(join(root, rel), 'utf8');

const fromLines = (dockerfile: string): string[] =>
  read(join('Dockerfiles', dockerfile))
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('FROM '));

const dockerfiles = readdirSync(dockerfilesDir).filter((name) => name.startsWith('Dockerfile.'));

describe('container image security — pinned bases and NATS tag', () => {
  it('covers every service Dockerfile', () => {
    expect(dockerfiles.length).toBeGreaterThanOrEqual(19);
  });

  it.each(dockerfiles)('%s inherits from the pinned Alpine base digest', (dockerfile) => {
    const lines = fromLines(dockerfile);
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      expect(line).toContain(PINNED_BASE);
    }
  });

  it('uses no unpinned node base tags', () => {
    for (const dockerfile of dockerfiles) {
      expect(read(join('Dockerfiles', dockerfile))).not.toMatch(/FROM\s+node:24-alpine3\.24(\s|$)/);
    }
  });

  it.each(['docker-compose.yml', 'docker-compose.nats.yml', 'docker-compose-dev.yml'])(
    '%s pins the NATS server to an explicit version',
    (composeFile) => {
      const content = read(composeFile);
      if (!/image:\s*nats/.test(content)) {
        return;
      }
      expect(content).toMatch(/image:\s*nats:\d+\.\d+\.\d+/);
      expect(content).not.toMatch(/image:\s*nats\s*(#.*)?$/m);
    }
  );

  it('lets Dependabot track the pinned Dockerfiles', () => {
    const dependabot = read('.github/dependabot.yml');
    expect(dependabot).toContain('package-ecosystem: "docker"');
    expect(dependabot).toContain('"/Dockerfiles"');
  });
});
