import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { user } from '@prisma/client';
import { BaseService } from 'libs/service/base.service';
import { AgentSpinupDto } from './dto/agent-service.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { AgentStatus } from './interface/agent-service.interface';

@Injectable()
export class AgentService extends BaseService {
    constructor(
        @Inject('NATS_CLIENT') private readonly agentServiceProxy: ClientProxy
    ) {
        super('AgentService');
    }

    async agentSpinup(agentSpinupDto: AgentSpinupDto, user: user): Promise<{ response: object }> {
        const payload = { agentSpinupDto, user };
        return this.sendNats(this.agentServiceProxy, 'agent-spinup', payload);
    }

    async createTenant(createTenantDto: CreateTenantDto, user: user): Promise<{ response: object }> {
        const payload = { createTenantDto, user };
        return this.sendNats(this.agentServiceProxy, 'create-tenant', payload);
    }

    async getAgentHealth(user: user, orgId:string): Promise<AgentStatus> {
        const payload = { user, orgId };

        // NATS call
        return this.sendNatsMessage(this.agentServiceProxy, 'agent-health', payload);
        
    }

}
