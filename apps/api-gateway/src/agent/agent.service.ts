/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
/* eslint-disable no-return-await */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Injectable,  Inject  } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';

import { WalletDetailsDto } from '../dtos/wallet-details.dto';

@Injectable()
export class AgentService extends BaseService {
    constructor(
        @Inject('NATS_CLIENT') private readonly agentServiceProxy: ClientProxy
    ) {
        super('AgentService');
    }


    /**
     * Description: Calling agent service for get-all-did
     * @param _public 
     * @param verkey 
     * @param did 
     */
    getAllDid(_public: boolean, verkey: string, did: string, user: any) {
        this.logger.log('**** getAllDid called...');
        const payload = { _public, verkey, did, user };
        return this.sendNats(this.agentServiceProxy, 'get-all-did', payload);
    }

    /**
     * Description: Calling agent service for create-local-did
     */
    createLocalDid(user: any) {
        this.logger.log('**** createLocalDid called...');
        return this.sendNats(this.agentServiceProxy, 'create-local-did', user);
    }

    async walletProvision(walletUserDetails: WalletDetailsDto, user: any) {
        this.logger.log(`**** walletProvision called...${JSON.stringify(walletUserDetails)}`);      
        const payload = { walletUserDetails, user };
        return await this.sendNats(this.agentServiceProxy, 'wallet-provision', payload);       
    }

    /**
     * Description: Calling agent service for get-public-did
     */
    getPublicDid(user: any) {
        this.logger.log('**** getPublicDid called...');
        return this.sendNats(this.agentServiceProxy, 'get-public-did', user);
    }

    /**
     * Description: Calling agent service for assign-public-did
     * @param did 
     */
    assignPublicDid(id: number, user: any) {
        this.logger.log('**** assignPublicDid called...');
        const payload = { id, user };
        return this.sendNats(this.agentServiceProxy, 'assign-public-did-org', payload);
    }


    /**
     * Description: Calling agent service for onboard-register-ledger
     * @param role 
     * @param alias 
     * @param verkey 
     * @param did 
     */
    registerNym(id: string, user: any) {
        this.logger.log('**** registerNym called...');
        const payload = { id, user };
        return this.sendNats(this.agentServiceProxy, 'register-nym-org', payload);
    }

    restartStopAgent(action: string, orgId: string) {
        const payload = { action, orgId };
        return this.sendNats(this.agentServiceProxy, 'restart-stop-agent', payload);
    }

    getAgentServerStatus(user) {

        return this.sendNats(this.agentServiceProxy, 'get-agent-server-status', user);
    }

    pingServiceAgent() {
        this.logger.log('**** pingServiceAgent called...');
        const payload = {};
        return this.sendNats(this.agentServiceProxy, 'ping-agent', payload);
    }

    agentSpinupStatus(items_per_page: number, page: number, search_text: string, agentStatus: string, sortValue: string, user: any) {
        this.logger.log('**** agentSpinupStatus called...');
        const payload = { items_per_page, page, search_text, agentStatus, sortValue, user };
        return this.sendNats(this.agentServiceProxy, 'get-agent-spinup-status', payload);
    }
}
