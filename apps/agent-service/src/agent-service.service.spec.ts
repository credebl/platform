import { ledgers, organisation } from '@prisma/client';
import { IAgentSpinupDto, IWalletProvision } from './interface/agent-service.interface';
import { AgentServiceService } from './agent-service.service';

describe('AgentServiceService.prepareWalletProvisionPayload', () => {
  const service = new AgentServiceService(
    null as never,
    null as never,
    null as never,
    null as never,
    null as never,
    null as never,
    null as never
  );
  const spinup = {
    walletName: 'test-wallet',
    walletPassword: 'test-password',
    seed: 'test-seed',
    keyType: 'ed25519',
    method: 'indy'
  } as IAgentSpinupDto;
  const org = { id: 'org-1', name: 'Test Organization' } as organisation;

  async function provision(ledgerDetails: Pick<ledgers, 'poolConfig' | 'indyNamespace'>[]): Promise<IWalletProvision> {
    return service.prepareWalletProvisionPayload(
      spinup,
      '127.0.0.1',
      'http://api.example.test',
      'http://agent.example.test',
      ledgerDetails as ledgers[],
      org
    );
  }

  it('serializes no Indy ledgers as an empty JSON array', async () => {
    const payload = await provision([]);
    expect(JSON.parse(payload.indyLedger)).toEqual([]);
  });

  it('round-trips a non-empty genesis containing quotes, newlines, and backslashes', async () => {
    const genesisTransactions = [
      JSON.stringify({ txn: { data: { alias: 'Node "One"', path: 'C:\\indy\\pool' } } }),
      JSON.stringify({ txn: { data: { alias: 'Node Two' } } })
    ].join('\n');
    const indyNamespace = 'test:local';
    const payload = await provision([{ poolConfig: genesisTransactions, indyNamespace }]);
    expect(JSON.parse(payload.indyLedger)).toEqual([{ genesisTransactions, indyNamespace }]);
  });

  it('preserves multiple ledgers in their input order', async () => {
    const payload = await provision([
      { poolConfig: 'first genesis', indyNamespace: 'test:first' },
      { poolConfig: 'second genesis', indyNamespace: 'test:second' }
    ]);
    expect(JSON.parse(payload.indyLedger)).toEqual([
      { genesisTransactions: 'first genesis', indyNamespace: 'test:first' },
      { genesisTransactions: 'second genesis', indyNamespace: 'test:second' }
    ]);
  });
});
