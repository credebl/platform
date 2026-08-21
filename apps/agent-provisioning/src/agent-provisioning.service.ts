import * as dotenv from 'dotenv';
import { promises as fs } from 'fs';

import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { AgentType } from '@credebl/enum/enum';
import { IWalletProvision } from './interface/agent-provisioning.interfaces';
import { RpcException } from '@nestjs/microservices';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const SAFE_FILE_IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const DEFAULT_AGENT_PROVISION_TIMEOUT_MS = 300_000;

dotenv.config();

@Injectable()
export class AgentProvisioningService {
  constructor(private readonly logger: Logger) {}

  /**
   * Description: Wallet provision
   * @param payload
   * @returns Get DID and verkey
   */
  async walletProvision(payload: IWalletProvision): Promise<object> {
    try {
      const {
        containerName,
        externalIp,
        orgId,
        seed,
        walletName,
        walletPassword,
        walletStorageHost,
        walletStoragePassword,
        walletStoragePort,
        walletStorageUser,
        webhookEndpoint,
        agentType,
        protocol,
        credoImage,
        tenant,
        indyLedger,
        inboundEndpoint
      } = payload;
      if (agentType === AgentType.AFJ) {
        this.assertSafeFileIdentifier(orgId, 'orgId');
        const safeContainerName = this.normalizeContainerName(containerName);

        const spinUpScript = process.env.AFJ_AGENT_SPIN_UP;
        const endpointDirectory = process.env.AFJ_AGENT_ENDPOINT_PATH;
        if (!spinUpScript || !endpointDirectory) {
          throw new Error('AFJ_AGENT_SPIN_UP and AFJ_AGENT_ENDPOINT_PATH must be configured');
        }

        const requiredEnvironment = [
          'SCHEMA_FILE_SERVER_URL',
          'AGENT_API_KEY',
          'AWS_ACCOUNT_ID',
          'S3_BUCKET_ARN',
          'CLUSTER_NAME',
          'TASKDEFINITION_FAMILY',
          'ADMIN_TG_ARN',
          'INBOUND_TG_ARN',
          'FILESYSTEMID',
          'ECS_SUBNET_ID',
          'ECS_SECURITY_GROUP_ID'
        ];
        const missingEnvironment = requiredEnvironment.filter((name) => !process.env[name]);
        if (missingEnvironment.length) {
          throw new Error(`Missing provisioning configuration: ${missingEnvironment.join(', ')}`);
        }

        const provisionTimeoutMs = this.getProvisionTimeoutMs();
        await execFileAsync(
          `${process.cwd()}${spinUpScript}`,
          [
            orgId,
            externalIp,
            walletName,
            walletPassword,
            seed,
            webhookEndpoint,
            walletStorageHost,
            walletStoragePort,
            walletStorageUser,
            walletStoragePassword,
            safeContainerName,
            protocol,
            String(tenant),
            credoImage,
            indyLedger,
            inboundEndpoint,
            ...requiredEnvironment.map((name) => process.env[name] as string)
          ],
          { timeout: provisionTimeoutMs, maxBuffer: 1024 * 1024 }
        ).catch((error) => {
          const failureDetail =
            'number' === typeof error?.code
              ? ` (exit code ${error.code})`
              : 'string' === typeof error?.signal
                ? ` (signal ${error.signal})`
                : '';
          throw new Error(`Agent provisioning script failed${failureDetail}`);
        });

        const agentEndpointPath = `${process.cwd()}${endpointDirectory}${orgId}_${safeContainerName}.json`;
        const agentEndPointExists = await this.checkFileExistence(agentEndpointPath);
        if (!agentEndPointExists) {
          throw new NotFoundException(`Agent endpoint file does not exist: ${agentEndpointPath}`);
        }

        const agentEndPoint = await fs.readFile(agentEndpointPath, 'utf8');
        let parsedEndpoint: unknown;
        try {
          parsedEndpoint = JSON.parse(agentEndPoint);
        } catch (parseError) {
          this.logger.error(`Failed to parse agent endpoint file: ${parseError.message}`);
          throw new Error(`Invalid JSON in agent endpoint file: ${agentEndpointPath}`);
        }

        const controllerEndpoint =
          null !== parsedEndpoint && 'object' === typeof parsedEndpoint && !Array.isArray(parsedEndpoint)
            ? (parsedEndpoint as Record<string, unknown>).CONTROLLER_ENDPOINT
            : undefined;
        if ('string' !== typeof controllerEndpoint || !controllerEndpoint.trim()) {
          throw new Error(`Missing CONTROLLER_ENDPOINT in: ${agentEndpointPath}`);
        }

        return { agentEndPoint: controllerEndpoint };
      } else if (agentType === AgentType.ACAPY) {
        // TODO: ACA-PY Agent Spin-Up
      }
    } catch (error) {
      this.logger.error(
        `[walletProvision] - error in wallet provision: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw new RpcException(error);
    }
  }

  private getProvisionTimeoutMs(): number {
    const configuredTimeout = process.env.AFJ_AGENT_PROVISION_TIMEOUT_MS;
    if (!configuredTimeout) {
      return DEFAULT_AGENT_PROVISION_TIMEOUT_MS;
    }

    const timeout = Number(configuredTimeout);
    if (!Number.isInteger(timeout) || 0 >= timeout) {
      throw new Error('AFJ_AGENT_PROVISION_TIMEOUT_MS must be a positive integer');
    }

    return timeout;
  }

  private normalizeContainerName(value: unknown): string {
    if ('string' !== typeof value) {
      throw new Error('containerName contains unsafe characters');
    }

    const normalized = value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 128);

    return normalized || 'agent';
  }

  async checkFileExistence(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true; // File exists
    } catch (error) {
      return false; // File does not exist
    }
  }

  private assertSafeFileIdentifier(value: unknown, field: string): void {
    if ('string' !== typeof value || !SAFE_FILE_IDENTIFIER.test(value)) {
      throw new Error(`${field} contains unsafe characters`);
    }
  }
}
