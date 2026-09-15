const mockExecFile = jest.fn();
const mockReadFile = jest.fn();
const mockAccess = jest.fn();

jest.mock('node:child_process', () => ({ execFile: mockExecFile }));
jest.mock('node:util', () => ({ promisify: jest.fn(() => mockExecFile) }));
jest.mock('fs', () => ({ promises: { access: mockAccess, readFile: mockReadFile } }));

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
    mockExecFile.mockResolvedValue({ stdout: '', stderr: '' });
    mockReadFile.mockResolvedValue('{"CONTROLLER_ENDPOINT":"https://agent.example"}');
  });
  afterAll(() => {
    process.env = savedEnv;
  });

  it.each(['start_agent.sh', 'docker_start_agent.sh'])(
    'provisions with local %s using only common configuration and positional placeholders',
    async (script) => {
      process.env.AFJ_AGENT_SPIN_UP = `/apps/agent-provisioning/AFJ/scripts/${script}`;
      const walletPassword = 'secret; $(echo injected)';
      await expect(service.walletProvision({ ...payload, walletPassword })).resolves.toEqual({
        agentEndPoint: 'https://agent.example'
      });
      const [[scriptPath, args, options]] = mockExecFile.mock.calls;
      expect(scriptPath).toContain(script);
      expect(args[3]).toBe(walletPassword);
      expect(options.shell).toBeUndefined();
      expect(args).toHaveLength(27);
      expect(args.slice(16, 18)).toEqual(['https://schema.example', 'agent-key']);
      expect(args.slice(18)).toEqual(Array(9).fill(''));
      expect(options).toEqual(
        expect.objectContaining({
          timeout: 300000,
          maxBuffer: 1024 * 1024
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
    const [[, args]] = mockExecFile.mock.calls;
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
    const [[, args]] = mockExecFile.mock.calls;
    expect(args).toHaveLength(27);
    expect(args.slice(18, 25)).toEqual(awsArguments.slice(0, 7));
    expect(args.slice(25)).toEqual(['', '']);

    mockExecFile.mockClear();
    delete process.env.FILESYSTEMID;
    await expect(service.walletProvision(payload)).rejects.toThrow('FILESYSTEMID');
    expect(mockExecFile).not.toHaveBeenCalled();
  });

  it('requires all Fargate configuration in the original argument positions', async () => {
    process.env.AFJ_AGENT_SPIN_UP = '/apps/agent-provisioning/AFJ/scripts/fargate.sh';
    Object.assign(process.env, awsEnvironment);
    await service.walletProvision(payload);
    const [[, args]] = mockExecFile.mock.calls;
    expect(args).toHaveLength(27);
    expect(args.slice(18)).toEqual(awsArguments);

    mockExecFile.mockClear();
    delete process.env.ECS_SECURITY_GROUP_ID;
    await expect(service.walletProvision(payload)).rejects.toThrow('ECS_SECURITY_GROUP_ID');
    expect(mockExecFile).not.toHaveBeenCalled();
  });

  it('rejects unsafe organization identifiers before executing a script', async () => {
    await expect(service.walletProvision({ ...payload, orgId: '../another-org' })).rejects.toThrow(
      'orgId contains unsafe characters'
    );
    expect(mockExecFile).not.toHaveBeenCalled();
  });

  it.each([
    ['___agent__name___', 'agent__name'],
    ['Crédit Agricole, Inc.', 'Credit_Agricole_Inc'],
    [`a${'_'.repeat(100_000)}b`, `a${'_'.repeat(127)}`]
  ])('preserves container name normalization (case %#)', async (containerName, expected) => {
    await service.walletProvision({ ...payload, containerName });
    const [[, args]] = mockExecFile.mock.calls;
    expect(args[10]).toBe(expected);
    expect(mockReadFile).toHaveBeenCalledWith(expect.stringContaining(`org-123_${expected}.json`), 'utf8');
  });

  it('rejects a non-object endpoint document', async () => {
    mockReadFile.mockResolvedValue('null');
    await expect(service.walletProvision(payload)).rejects.toThrow('Missing CONTROLLER_ENDPOINT');
  });

  it('reports a script exit code without logging script output or credentials', async () => {
    mockExecFile.mockRejectedValue(
      Object.assign(new Error('wallet-secret'), { code: 17, stdout: 'stdout-secret', stderr: 'stderr-secret' })
    );
    await expect(service.walletProvision(payload)).rejects.toThrow('Agent provisioning script failed');
    expect(mockReadFile).not.toHaveBeenCalled();
    const logs = JSON.stringify(logger.error.mock.calls);
    expect(logs).toContain('exit code 17');
    expect(logs).not.toContain('wallet-secret');
    expect(logs).not.toContain('stdout-secret');
    expect(logs).not.toContain('stderr-secret');
  });
});
