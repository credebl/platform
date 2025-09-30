/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
/* eslint-disable no-return-await */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Injectable, Inject } from '@nestjs/common';
import { BaseService } from 'libs/service/base.service';

import { WalletDetailsDto } from '../dtos/wallet-details.dto';
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
   * Description: Calling agent service for get-all-did
   * @param _public
   * @param verkey
   * @param did
   */
  getAllDid(_public: boolean, verkey: string, did: string, user: any) {
    this.logger.log('**** getAllDid called...');
    const payload = { _public, verkey, did, user };
    return this.natsClient.sendNats(this.agentServiceProxy, 'get-all-did', payload);
  }

  /**
   * Description: Calling agent service for create-local-did
   */
  createLocalDid(user: any) {
    this.logger.log('**** createLocalDid called...');
    return this.natsClient.sendNats(this.agentServiceProxy, 'create-local-did', user);
  }

  async walletProvision(walletUserDetails: WalletDetailsDto, user: any) {
    this.logger.log(`**** walletProvision called...${walletUserDetails.walletName}`);
    const payload = { walletUserDetails, user };
    return this.natsClient.sendNats(this.agentServiceProxy, 'wallet-provision', payload);
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
    return this.natsClient.sendNats(this.agentServiceProxy, 'register-nym-org', payload);
  }

  restartStopAgent(action: string, orgId: string) {
    const payload = { action, orgId };
    return this.natsClient.sendNats(this.agentServiceProxy, 'restart-stop-agent', payload);
  }

  getAgentServerStatus(user) {
    return this.natsClient.sendNats(this.agentServiceProxy, 'get-agent-server-status', user);
  }

  pingServiceAgent() {
    this.logger.log('**** pingServiceAgent called...');
    const payload = {};
    return this.natsClient.sendNats(this.agentServiceProxy, 'ping-agent', payload);
  }

  agentSpinupStatus(
    items_per_page: number,
    page: number,
    search_text: string,
    agentStatus: string,
    sortValue: string,
    user: any
  ) {
    this.logger.log('**** agentSpinupStatus called...');
    const payload = { items_per_page, page, search_text, agentStatus, sortValue, user };
    return this.natsClient.sendNats(this.agentServiceProxy, 'get-agent-spinup-status', payload);
  }
}
