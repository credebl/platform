import { Controller } from '@nestjs/common';
import { AgentProvisioningService } from './agent-provisioning.service';
import { MessagePattern } from '@nestjs/microservices';
import { IWalletProvision } from './interface/agent-provisioning.interfaces';

@Controller()
export class AgentProvisioningController {
  constructor(private readonly agentProvisioningService: AgentProvisioningService) { }

  /**
   * Description: Wallet provision  
   * @param payload 
   * @returns Get DID and verkey
   */
  @MessagePattern({ cmd: 'wallet-provisioning' })
  walletProvision(payload: IWalletProvision): Promise<object> {
    return this.agentProvisioningService.walletProvision(payload);
  }
}
