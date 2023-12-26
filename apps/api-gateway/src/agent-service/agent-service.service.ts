import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { user } from '@prisma/client';
import { BaseService } from 'libs/service/base.service';
import { AgentSpinupDto } from './dto/agent-service.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';

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
    async agentSpinup(agentSpinupDto: AgentSpinupDto, user: user): Promise<{ response: object }> {
        const payload = { agentSpinupDto, user };
        return this.sendNatsMessage(this.agentServiceProxy, 'agent-spinup', payload);
    }

    async createTenant(createTenantDto: CreateTenantDto, user: user): Promise<{ response: object }> {
        const payload = { createTenantDto, user };
        return this.sendNats(this.agentServiceProxy, 'create-tenant', payload);
    }

    async getAgentHealth(user: user, orgId:string): Promise<{ response: object }> {
        const payload = { user, orgId };
        return this.sendNats(this.agentServiceProxy, 'agent-health', payload);
    }

}
