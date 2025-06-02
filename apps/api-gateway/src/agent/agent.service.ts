/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
/* eslint-disable no-return-await */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Inject, Injectable } from '@nestjs/common'
import type { ClientProxy } from '@nestjs/microservices'
import { BaseService } from 'libs/service/base.service'

import type { NATSClient } from '@credebl/common/NATSClient'
import type { user } from '@prisma/client'
import type { WalletDetailsDto } from '../dtos/wallet-details.dto'
import type { IUserRequestInterface } from '../interfaces/IUserRequestInterface'

@Injectable()
export class AgentService extends BaseService {
  constructor(
    @Inject('NATS_CLIENT') private readonly agentServiceProxy: ClientProxy,
    private readonly natsClient: NATSClient
  ) {
    super('AgentService')
  }

  /**
   * Description: Calling agent service for get-all-did
   * @param _public
   * @param verkey
   * @param did
   */
  getAllDid(_public: boolean, verkey: string, did: string, user: user) {
    this.logger.log('**** getAllDid called...')
    const payload = { _public, verkey, did, user }
    return this.natsClient.sendNats(this.agentServiceProxy, 'get-all-did', payload)
  }

  /**
   * Description: Calling agent service for create-local-did
   */
  createLocalDid(user: user) {
    this.logger.log('**** createLocalDid called...')
    return this.natsClient.sendNats(this.agentServiceProxy, 'create-local-did', user)
  }

  async walletProvision(walletUserDetails: WalletDetailsDto, user: IUserRequestInterface) {
    this.logger.log(`**** walletProvision called...${JSON.stringify(walletUserDetails)}`)
    const payload = { walletUserDetails, user }
    return await this.natsClient.sendNats(this.agentServiceProxy, 'wallet-provision', payload)
  }

  /**
   * Description: Calling agent service for get-public-did
   */
  getPublicDid(user: user) {
    this.logger.log('**** getPublicDid called...')
    return this.natsClient.sendNats(this.agentServiceProxy, 'get-public-did', user)
  }

  /**
   * Description: Calling agent service for assign-public-did
   * @param did
   */
  assignPublicDid(id: number, user: IUserRequestInterface) {
    this.logger.log('**** assignPublicDid called...')
    const payload = { id, user }
    return this.natsClient.sendNats(this.agentServiceProxy, 'assign-public-did-org', payload)
  }

  /**
   * Description: Calling agent service for onboard-register-ledger
   * @param role
   * @param alias
   * @param verkey
   * @param did
   */
  registerNym(id: string, user: IUserRequestInterface) {
    this.logger.log('**** registerNym called...')
    const payload = { id, user }
    return this.natsClient.sendNats(this.agentServiceProxy, 'register-nym-org', payload)
  }

  restartStopAgent(action: string, orgId: string) {
    const payload = { action, orgId }
    return this.natsClient.sendNats(this.agentServiceProxy, 'restart-stop-agent', payload)
  }

  getAgentServerStatus(user) {
    return this.natsClient.sendNats(this.agentServiceProxy, 'get-agent-server-status', user)
  }

  pingServiceAgent() {
    this.logger.log('**** pingServiceAgent called...')
    const payload = {}
    return this.natsClient.sendNats(this.agentServiceProxy, 'ping-agent', payload)
  }

  agentSpinupStatus(
    items_per_page: number,
    page: number,
    search_text: string,
    agentStatus: number,
    sortValue: string,
    user: user
  ) {
    this.logger.log('**** agentSpinupStatus called...')
    const payload = { items_per_page, page, search_text, agentStatus, sortValue, user }
    return this.natsClient.sendNats(this.agentServiceProxy, 'get-agent-spinup-status', payload)
  }
}
