const mockSpawn = jest.fn();
const mockReadFile = jest.fn();
const mockAccess = jest.fn();

jest.mock('node:child_process', () => ({ spawn: mockSpawn }));
jest.mock('fs', () => ({ promises: { access: mockAccess, readFile: mockReadFile } }));

import { EventEmitter } from 'node:events';
import { AgentType } from '@credebl/enum/enum';
import { AgentProvisioningService } from './agent-provisioning.service';

const payload = {
  orgId: 'org-123',
  externalIp: '127.0.0.1',
  walletName: 'wallet',
  walletPassword: 'wallet-secret',
  seed: 'seed',
  webhookEndpoint: 'https://example.test/webhook',
  walletStorageHost: 'postgres',
  walletStoragePort: '5432',
  walletStorageUser: 'user',
  walletStoragePassword: 'storage-secret',
  internalIp: '127.0.0.1',
  containerName: 'issuer-agent',
  agentType: AgentType.AFJ,
  orgName: 'Organization',
  indyLedger: '[]',
  protocol: 'http',
  credoImage: 'credo:latest',
  tenant: false,
  inboundEndpoint: '127.0.0.1'
};
const awsEnvironment = {
  AWS_ACCOUNT_ID: 'account',
  S3_BUCKET_ARN: 'bucket',
  CLUSTER_NAME: 'cluster',
  TASKDEFINITION_FAMILY: 'family',
  ADMIN_TG_ARN: 'admin-tg',
  INBOUND_TG_ARN: 'inbound-tg',
  FILESYSTEMID: 'filesystem',
  ECS_SUBNET_ID: 'subnet',
  ECS_SECURITY_GROUP_ID: 'security-group'
};
const awsArguments = Object.values(awsEnvironment);

function closeChild(code = 0): EventEmitter {
  const child = Object.assign(new EventEmitter(), { pid: undefined, kill: jest.fn() });
  queueMicrotask(() => child.emit('close', code, null));
  return child;
}

function errorChild(error: Error): EventEmitter {
  const child = Object.assign(new EventEmitter(), { pid: undefined, kill: jest.fn() });
  queueMicrotask(() => child.emit('error', error));
  return child;
}

describe('AgentProvisioningService', () => {
  const logger = { log: jest.fn(), error: jest.fn() };
  const service = new AgentProvisioningService(logger as never);
  const savedEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...savedEnv,
      AFJ_AGENT_SPIN_UP: '/apps/agent-provisioning/AFJ/scripts/start_agent.sh',
      AFJ_AGENT_ENDPOINT_PATH: '/apps/agent-provisioning/AFJ/endpoints/',
      SCHEMA_FILE_SERVER_URL: 'https://schema.example',
      AGENT_API_KEY: 'agent-key'
    };
    for (const name of Object.keys(awsEnvironment)) {
      delete process.env[name];
    }
    mockSpawn.mockImplementation(() => closeChild());
    mockReadFile.mockResolvedValue('{"CONTROLLER_ENDPOINT":"https://agent.example"}');
  });
  afterAll(() => {
    process.env = savedEnv;
  });

  it.each(['start_agent.sh', 'docker_start_agent.sh'])(
    'provisions with local %s using only common configuration and positional placeholders',
    async (script) => {
      process.env.AFJ_AGENT_SPIN_UP = `/apps/agent-provisioning/AFJ/scripts/${script}`;
      await expect(service.walletProvision(payload)).resolves.toEqual({ agentEndPoint: 'https://agent.example' });
      const [[scriptPath, args, options]] = mockSpawn.mock.calls;
      expect(scriptPath).toContain(script);
      expect(args).toHaveLength(27);
      expect(args.slice(16, 18)).toEqual(['https://schema.example', 'agent-key']);
      expect(args.slice(18)).toEqual(Array(9).fill(''));
      expect(options).toEqual(
        expect.objectContaining({
          timeout: 300000,
          detached: true,
          killSignal: 'SIGKILL',
          stdio: 'ignore'
        })
      );
    }
  );

  it('retains nonempty ledger JSON in the fifteenth argument', async () => {
    const ledgers = [
      {
        genesisTransactions: '{"txn":{"alias":"Node1"}}\n{"txn":{"alias":"Node2"}}',
        indyNamespace: 'test:ledger'
      }
    ];
    const indyLedger = JSON.stringify(ledgers);
    await service.walletProvision({ ...payload, indyLedger });
    const [[, args]] = mockSpawn.mock.calls;
    expect(args[14]).toBe(indyLedger);
    expect(JSON.parse(args[14])).toEqual(ledgers);
    expect(args[15]).toBe(payload.inboundEndpoint);
  });

  it('requires ECS configuration while leaving unused positional arguments empty', async () => {
    process.env.AFJ_AGENT_SPIN_UP = '/apps/agent-provisioning/AFJ/scripts/start_agent_ecs.sh';
    Object.assign(process.env, awsEnvironment);
    delete process.env.ECS_SUBNET_ID;
    delete process.env.ECS_SECURITY_GROUP_ID;
    await service.walletProvision(payload);
    const [[, args]] = mockSpawn.mock.calls;
    expect(args).toHaveLength(27);
    expect(args.slice(18, 25)).toEqual(awsArguments.slice(0, 7));
    expect(args.slice(25)).toEqual(['', '']);

    mockSpawn.mockClear();
    delete process.env.FILESYSTEMID;
    await expect(service.walletProvision(payload)).rejects.toThrow('FILESYSTEMID');
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it('requires all Fargate configuration in the original argument positions', async () => {
    process.env.AFJ_AGENT_SPIN_UP = '/apps/agent-provisioning/AFJ/scripts/fargate.sh';
    Object.assign(process.env, awsEnvironment);
    await service.walletProvision(payload);
    const [[, args]] = mockSpawn.mock.calls;
    expect(args).toHaveLength(27);
    expect(args.slice(18)).toEqual(awsArguments);

    mockSpawn.mockClear();
    delete process.env.ECS_SECURITY_GROUP_ID;
    await expect(service.walletProvision(payload)).rejects.toThrow('ECS_SECURITY_GROUP_ID');
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it('rejects unsafe organization identifiers before executing a script', async () => {
    await expect(service.walletProvision({ ...payload, orgId: '../another-org' })).rejects.toThrow(
      'orgId contains unsafe characters'
    );
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it.each([
    ['', 'agent'],
    ['____', 'agent'],
    ['___agent__name___', 'agent__name'],
    ['-agent-', '-agent-'],
    [`a${'_'.repeat(100_000)}`, 'a'],
    ['Crédit Agricole, Inc.', 'Credit_Agricole_Inc'],
    [`a${'_'.repeat(100_000)}b`, `a${'_'.repeat(127)}`],
    [`${'a'.repeat(127)}_b`, `${'a'.repeat(127)}_`]
  ])('preserves container name normalization (case %#)', async (containerName, expected) => {
    await service.walletProvision({ ...payload, containerName });
    const [[, args]] = mockSpawn.mock.calls;
    expect(args[10]).toBe(expected);
    expect(mockReadFile).toHaveBeenCalledWith(expect.stringContaining(`org-123_${expected}.json`), 'utf8');
  });

  it('rejects an invalid endpoint JSON document', async () => {
    mockReadFile.mockResolvedValue('not JSON');
    await expect(service.walletProvision(payload)).rejects.toThrow('Invalid JSON in agent endpoint file');
  });

  it.each([{}, 1, [], '', '   '])('rejects an invalid controller endpoint', async (endpoint) => {
    mockReadFile.mockResolvedValue(JSON.stringify({ CONTROLLER_ENDPOINT: endpoint }));
    await expect(service.walletProvision(payload)).rejects.toThrow('Missing CONTROLLER_ENDPOINT');
  });

  it('rejects a non-object endpoint document', async () => {
    mockReadFile.mockResolvedValue('null');
    await expect(service.walletProvision(payload)).rejects.toThrow('Missing CONTROLLER_ENDPOINT');
  });

  it('uses the configured timeout', async () => {
    process.env.AFJ_AGENT_PROVISION_TIMEOUT_MS = '600000';
    await service.walletProvision(payload);
    const [[, , options]] = mockSpawn.mock.calls;
    expect(options.timeout).toBe(600000);
  });

  it('reports a script exit code without logging script output or credentials', async () => {
    mockSpawn.mockImplementation(() => closeChild(17));
    await expect(service.walletProvision(payload)).rejects.toThrow('Agent provisioning script failed');
    expect(mockReadFile).not.toHaveBeenCalled();
    const logs = JSON.stringify(logger.error.mock.calls);
    expect(logs).toContain('exit code 17');
    expect(logs).not.toContain('wallet-secret');
  });

  it('reports ENOENT without exposing a spawn error message', async () => {
    const failure = Object.assign(new Error('spawn wallet-secret ENOENT'), { code: 'ENOENT' });
    mockSpawn.mockImplementation(() => errorChild(failure));
    await expect(service.walletProvision(payload)).rejects.toThrow('ENOENT');
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain('wallet-secret');
    expect(mockReadFile).not.toHaveBeenCalled();
  });
});
