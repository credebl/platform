import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { user } from '@prisma/client';
import { BaseService } from 'libs/service/base.service';
import { AgentSpinupDto } from './dto/agent-service.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { AgentSpinUpSatus, IWalletRecord } from './interface/agent-service.interface';
import { AgentStatus } from './interface/agent-service.interface';
import { CreateDidDto } from './dto/create-did.dto';
import { CreateWalletDto } from './dto/create-wallet.dto';

@Injectable()
export class AgentService extends BaseService {
    constructor(
        @Inject('NATS_CLIENT') private readonly agentServiceProxy: ClientProxy
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
        return this.sendNatsMessage(this.agentServiceProxy, 'agent-spinup', payload);
    }

    async createTenant(createTenantDto: CreateTenantDto, user: user): Promise<AgentSpinUpSatus> {
        const payload = { createTenantDto, user };

        // NATS call
        return this.sendNatsMessage(this.agentServiceProxy, 'create-tenant', payload);
    }

    async createDid(createDidDto: CreateDidDto, orgId:string, user: user): Promise<object> {
        const payload = { createDidDto, orgId, user };

        // NATS call
        return this.sendNatsMessage(this.agentServiceProxy, 'create-did', payload);
    }

    async createWallet(createWalletDto: CreateWalletDto, user: user): Promise<IWalletRecord> {
        const payload = { createWalletDto, user };
        // NATS call
        return this.sendNatsMessage(this.agentServiceProxy, 'create-wallet', payload);
    }

    async getAgentHealth(user: user, orgId:string): Promise<AgentStatus> {
        const payload = { user, orgId };

        // NATS call
        return this.sendNatsMessage(this.agentServiceProxy, 'agent-health', payload);
        
    }

    async getLedgerConfig(user: user): Promise<object> {
        const payload = { user };

        // NATS call
        return this.sendNatsMessage(this.agentServiceProxy, 'get-ledger-config', payload);
    }

}
