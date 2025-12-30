import { NATSClient } from '@credebl/common/NATSClient';
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { IEcosystemInvitations } from 'apps/ecosystem/interfaces/ecosystem.intefaces';
import { SendEcosystemCreateDto } from './dtos/send-ecosystem-invitation';

@Injectable()
export class EcosystemService {
  constructor(
    @Inject('NATS_CLIENT') private readonly serviceProxy: ClientProxy,
    private readonly natsClient: NATSClient
  ) {}

  /**
   *
   * @param SendEcosystemCreateDto
   * @returns Ecosystem creation success
   */
  async ecosystemCreateInvitation(sendEcosystemCreateDto: SendEcosystemCreateDto): Promise<IEcosystemInvitations> {
    const payload = { sendEcosystemCreateDto };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'create-ecosystem-invitation', payload);
  }
  /**
   *
   * @param createEcosystemDto
   * @returns Ecosystem creation success
   */
  // async createEcosystem(createEcosystemDto: CreateEcosystemDto): Promise<IEcosystem> {
  //   const payload = { createEcosystemDto };
  // return this.natsClient.sendNatsMessage(this.serviceProxy, 'create-ecosystem', payload);
  // }
}
