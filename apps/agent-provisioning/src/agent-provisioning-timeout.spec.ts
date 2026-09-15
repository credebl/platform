import { mkdtempSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { Logger } from '@nestjs/common';
import { AgentType } from '@credebl/enum/enum';
import { AgentProvisioningService } from './agent-provisioning.service';
import { IWalletProvision } from './interface/agent-provisioning.interfaces';

describe('Provisioning timeout', () => {
  it('stops the script and its child before the child can write after a timeout', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'provisioning-timeout-'));
    const savedEnv = { ...process.env };
    const started = join(directory, 'started');
    const completed = join(directory, 'completed');
    const childPath = join(directory, 'child.cjs');
    const scriptPath = join(directory, 'run.sh');
    writeFileSync(
      childPath,
      `
      const fs = require('node:fs');
      fs.writeFileSync(${JSON.stringify(started)}, 'started');
      setTimeout(() => {
        if (fs.existsSync(${JSON.stringify(directory)})) {
          fs.writeFileSync(${JSON.stringify(completed)}, 'completed');
        }
      }, 3000);
    `
    );
    writeFileSync(
      scriptPath,
      `#!/bin/sh
trap '' TERM
"$PROVISIONING_TEST_NODE" "$PROVISIONING_TEST_CHILD" &
wait
`,
      { mode: 0o700 }
    );
    process.env.PROVISIONING_TEST_NODE = process.execPath;
    process.env.PROVISIONING_TEST_CHILD = childPath;
    process.env.AFJ_AGENT_SPIN_UP = `/${relative(process.cwd(), scriptPath)}`;
    process.env.AFJ_AGENT_ENDPOINT_PATH = '/unused/';
    process.env.AFJ_AGENT_PROVISION_TIMEOUT_MS = '1000';
    process.env.SCHEMA_FILE_SERVER_URL = 'https://schema.example.test';
    process.env.AGENT_API_KEY = 'test-key';
    const logger = { error: jest.fn() };
    const service = new AgentProvisioningService(logger as unknown as Logger);
    const payload = {
      orgId: 'org-test',
      containerName: 'agent',
      agentType: AgentType.AFJ,
      externalIp: '127.0.0.1',
      walletName: 'wallet',
      walletPassword: 'test-key',
      seed: 'seed',
      webhookEndpoint: 'https://webhook.example.test',
      walletStorageHost: 'postgres',
      walletStoragePort: '5432',
      walletStorageUser: 'user',
      walletStoragePassword: 'test-key',
      protocol: 'http',
      tenant: false,
      credoImage: 'credo:test',
      indyLedger: '[]',
      inboundEndpoint: '127.0.0.1'
    } as IWalletProvision;

    try {
      await expect(service.walletProvision(payload)).rejects.toThrow('signal SIGKILL');
      expect(existsSync(started)).toBe(true);
      await new Promise((resolve) => setTimeout(resolve, 3300));
      expect(existsSync(completed)).toBe(false);
    } finally {
      process.env = savedEnv;
      rmSync(directory, { recursive: true, force: true });
    }
  }, 10_000);
});
