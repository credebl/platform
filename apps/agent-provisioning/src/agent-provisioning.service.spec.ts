const mockExecFile = jest.fn();
const mockReadFile = jest.fn();
const mockAccess = jest.fn();

jest.mock('child_process', () => ({ execFile: mockExecFile }));
jest.mock('util', () => ({ promisify: jest.fn(() => mockExecFile) }));
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
      AGENT_API_KEY: 'agent-key',
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
  });

  afterAll(() => {
    process.env = savedEnv;
  });

  it('executes the provisioning script without a shell and returns the generated endpoint', async () => {
    mockExecFile.mockResolvedValue({ stdout: '', stderr: '' });
    mockReadFile.mockResolvedValue('{"CONTROLLER_ENDPOINT":"https://agent.example"}');

    await expect(service.walletProvision(payload)).resolves.toEqual({ agentEndPoint: 'https://agent.example' });
    expect(mockExecFile).toHaveBeenCalledWith(
      expect.stringContaining('/apps/agent-provisioning/AFJ/scripts/start_agent.sh'),
      expect.arrayContaining([payload.orgId, payload.containerName, payload.walletPassword]),
      expect.objectContaining({ timeout: 300000 })
    );
  });

  it('normalizes organization-derived container names before executing the script and reading its endpoint', async () => {
    mockExecFile.mockResolvedValue({ stdout: '', stderr: '' });
    mockReadFile.mockResolvedValue('{"CONTROLLER_ENDPOINT":"https://agent.example"}');

    await expect(service.walletProvision({ ...payload, containerName: 'Crédit Agricole, Inc.' })).resolves.toEqual({
      agentEndPoint: 'https://agent.example'
    });
    expect(mockExecFile).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['Credit_Agricole_Inc']),
      expect.any(Object)
    );
    expect(mockReadFile).toHaveBeenCalledWith(expect.stringContaining('org-123_Credit_Agricole_Inc.json'), 'utf8');
  });

  it('rejects non-string identifiers before executing a script', async () => {
    await expect(service.walletProvision({ ...payload, orgId: 123 as unknown as string })).rejects.toThrow(
      'orgId contains unsafe characters'
    );
    expect(mockExecFile).not.toHaveBeenCalled();
  });

  it('uses a configured provisioning timeout', async () => {
    process.env.AFJ_AGENT_PROVISION_TIMEOUT_MS = '600000';
    mockExecFile.mockResolvedValue({ stdout: '', stderr: '' });
    mockReadFile.mockResolvedValue('{"CONTROLLER_ENDPOINT":"https://agent.example"}');

    await service.walletProvision(payload);
    expect(mockExecFile).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      expect.objectContaining({ timeout: 600000 })
    );
  });

  it.each([{}, 1, [], '', '   '])('rejects invalid CONTROLLER_ENDPOINT values', async (endpoint) => {
    mockExecFile.mockResolvedValue({ stdout: '', stderr: '' });
    mockReadFile.mockResolvedValue(JSON.stringify({ CONTROLLER_ENDPOINT: endpoint }));

    await expect(service.walletProvision(payload)).rejects.toThrow('Missing CONTROLLER_ENDPOINT');
  });

  it('rejects a non-object endpoint document', async () => {
    mockExecFile.mockResolvedValue({ stdout: '', stderr: '' });
    mockReadFile.mockResolvedValue('null');

    await expect(service.walletProvision(payload)).rejects.toThrow('Missing CONTROLLER_ENDPOINT');
  });

  it('propagates a provisioning script failure instead of attempting to read an endpoint file', async () => {
    const failure = Object.assign(new Error('script failed'), {
      code: 17,
      stdout: 'stdout-secret',
      stderr: 'stderr-secret'
    });
    mockExecFile.mockRejectedValue(failure);

    await expect(service.walletProvision(payload)).rejects.toThrow('Agent provisioning script failed');
    expect(mockReadFile).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain('stdout-secret');
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain('stderr-secret');
    expect(JSON.stringify(logger.error.mock.calls)).toContain('exit code 17');
  });
});
