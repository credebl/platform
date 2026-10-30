import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Exercise the real configuration template, stopping before container startup.
// No Docker, network calls, or real credentials are needed for this regression.
describe('Indy ledger configuration generation', () => {
  const genesisTransactions = [
    JSON.stringify({ txn: { data: { alias: 'Node "One"', path: 'C:\\ledger' } } }),
    JSON.stringify({ txn: { data: { alias: 'Node Two' } } })
  ].join('\n');
  const ledger = { genesisTransactions, indyNamespace: 'test:ledger' };
  let directory: string;
  let scriptPath: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'agent-config-test-'));
    mkdirSync(join(directory, 'apps/agent-provisioning/AFJ/port-file'), { recursive: true });
    const source = readFileSync(join(__dirname, '../AFJ/scripts/start_agent.sh'), 'utf8');
    const stopBefore = '\nFILE_NAME="docker-compose_';
    expect(source.split(stopBefore)).toHaveLength(2);
    const [configurationScript] = source.split(stopBefore);
    scriptPath = join(directory, 'generate-config.sh');
    writeFileSync(scriptPath, configurationScript, { mode: 0o700 });
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it.each([
    ['empty', []],
    ['multiple with quoted and multiline genesis', [ledger, { ...ledger, indyNamespace: 'test:second' }]]
  ])('preserves %s ledger data passed without shell escaping', (_name, ledgers) => {
    execFileSync(
      scriptPath,
      [
        'org-test',
        '127.0.0.1',
        'wallet',
        'test-wallet-key',
        'seed',
        'https://webhook.example.test',
        'postgres',
        '5432',
        'user',
        'test-storage-key',
        'agent-test',
        'http',
        'false',
        'credo:test',
        JSON.stringify(ledgers),
        '127.0.0.1',
        'https://schema.example.test',
        'test-api-key'
      ],
      { cwd: directory, timeout: 5000, stdio: 'pipe' }
    );

    const config = JSON.parse(
      readFileSync(join(directory, 'apps/agent-provisioning/AFJ/agent-config/org-test_agent-test.json'), 'utf8')
    );
    expect(config.indyLedger).toEqual(ledgers);
    expect(config.walletId).toBe('wallet');
  });
});
