import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { user } from '@prisma/client';
import { BaseService } from 'libs/service/base.service';
import { AgentSpinupDto } from './dto/agent-service.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { AgentSpinUpSatus, IWalletRecord } from './interface/agent-service.interface';
import { AgentStatus } from './interface/agent-service.interface';
import { CreateDidDto } from './dto/create-did.dto';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { ImportDidX509Dto } from './dto/import-did-x509.dto';
import { AgentConfigureDto } from './dto/agent-configure.dto';
import { NATSClient } from '@credebl/common/NATSClient';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class AgentService extends BaseService {
  constructor(
    @Inject('NATS_CLIENT') private readonly agentServiceProxy: ClientProxy,
    private readonly natsClient: NATSClient
  ) {
    super('AgentService');
  }

  /**
   * Spinup the agent by organization
   * @param agentSpinupDto
   * @param user
   * @returns Get agent status
   */
  async agentSpinup(agentSpinupDto: AgentSpinupDto, user: user): Promise<AgentSpinUpSatus> {
    const payload = { agentSpinupDto, user };

    // NATS call
    return this.natsClient.sendNatsMessage(this.agentServiceProxy, 'agent-spinup', payload);
  }

  async createTenant(createTenantDto: CreateTenantDto, user: user): Promise<AgentSpinUpSatus> {
    const payload = { createTenantDto, user };

    // NATS call
    return this.natsClient.sendNatsMessage(this.agentServiceProxy, 'create-tenant', payload);
  }

  async createDid(createDidDto: CreateDidDto, orgId: string, user: user): Promise<object> {
    this.assertNoPlaintextKeyMaterial(createDidDto);

    const payload = { createDidDto, orgId, user };

    // NATS call
    return this.natsClient.sendNatsMessage(this.agentServiceProxy, 'create-did', payload);
  }

  async createDidImportSession(orgId: string, method: string): Promise<object> {
    const payload = { orgId, method };

    // NATS call
    return this.natsClient.sendNatsMessage(this.agentServiceProxy, 'create-did-import-session', payload);
  }

  async importDidX509(importDidX509Dto: ImportDidX509Dto, orgId: string, user: user): Promise<object> {
    this.assertNoPlaintextKeyMaterial(importDidX509Dto);

    const payload = { importDidX509Dto, orgId, user };

    // NATS call
    return this.natsClient.sendNatsMessage(this.agentServiceProxy, 'import-did-x509', payload);
  }

  /**
   * Plaintext key material must never reach NATS, the agent service or the agent logs. Reject it here, at the edge,
   * unless the explicit migration escape hatch is enabled. The agent itself enforces the same rule, so enabling the
   * flag on only one side still fails closed.
   */
  private assertNoPlaintextKeyMaterial(payload: {
    privateKey?: string;
    privateKeyJwk?: unknown;
    passphrase?: string;
    privatekey?: string;
  }): void {
    if (['1', 'true', 'yes', 'on'].includes((process.env.ALLOW_PLAINTEXT_KEY_IMPORT ?? '').trim().toLowerCase())) {
      return;
    }
    if (payload.privateKey || payload.privateKeyJwk || payload.passphrase || payload.privatekey) {
      throw new BadRequestException(
        'Plaintext private key import is disabled. Request a key import session and send the encryptedKey envelope instead.'
      );
    }
  }

  async getDidX509Chain(orgId: string, did: string): Promise<object> {
    const payload = { orgId, did };

    // NATS call
    return this.natsClient.sendNatsMessage(this.agentServiceProxy, 'get-did-x509-chain', payload);
  }

  async createWallet(createWalletDto: CreateWalletDto, user: user): Promise<IWalletRecord> {
    const payload = { createWalletDto, user };
    // NATS call
    return this.natsClient.sendNatsMessage(this.agentServiceProxy, 'create-wallet', payload);
  }

  async getAgentHealth(user: user, orgId: string): Promise<AgentStatus> {
    const payload = { user, orgId };

    // NATS call
    return this.natsClient.sendNatsMessage(this.agentServiceProxy, 'agent-health', payload);
  }

  async signData(data: unknown, orgId: string): Promise<AgentStatus> {
    const payload = { data, orgId };

    // NATS call
    return this.natsClient.sendNatsMessage(this.agentServiceProxy, 'sign-data-from-agent', payload);
  }

  async verifysignature(data: unknown, orgId: string): Promise<AgentStatus> {
    const payload = { data, orgId };

    // NATS call
    return this.natsClient.sendNatsMessage(this.agentServiceProxy, 'verify-signature-from-agent', payload);
  }

  async getLedgerConfig(user: user): Promise<object> {
    const payload = { user };

    // NATS call
    return this.natsClient.sendNatsMessage(this.agentServiceProxy, 'get-ledger-config', payload);
  }

  async createSecp256k1KeyPair(orgId: string): Promise<object> {
    const payload = { orgId };
    // NATS call

    return this.natsClient.sendNatsMessage(this.agentServiceProxy, 'polygon-create-keys', payload);
  }

  async agentConfigure(agentConfigureDto: AgentConfigureDto, user: user): Promise<object> {
    const payload = { agentConfigureDto, user };
    // NATS call

    return this.natsClient.sendNatsMessage(this.agentServiceProxy, 'agent-configure', payload);
  }

  async deleteWallet(orgId: string, user: user): Promise<object> {
    const payload = { orgId, user };
    // NATS call

    return this.natsClient.sendNatsMessage(this.agentServiceProxy, 'delete-wallet', payload);
  }
}
