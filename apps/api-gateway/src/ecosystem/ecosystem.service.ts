import { NATSClient } from '@credebl/common/NATSClient';
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SendEcosystemCreateDto } from './dtos/send-ecosystem-invitation';
import { IEcosystem, IEcosystemDashboard, IEcosystemInvitations } from 'apps/ecosystem/interfaces/ecosystem.interfaces';
import { CreateEcosystemDto } from 'apps/ecosystem/dtos/create-ecosystem-dto';

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
  async inviteUserToCreateEcosystem(
    dto: SendEcosystemCreateDto,
    platformAdminId: string
  ): Promise<IEcosystemInvitations> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'invite-user-for-ecosystem-creation', {
      email: dto.email,
      platformAdminId
    });
  }
  /**
   *
   * @param userId
   * @returns Get invitations
   */
  async getInvitationsByUserId(userId: string): Promise<IEcosystemInvitations[]> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-ecosystem-invitations-by-user', { userId });
  }

  /**
   *
   * @param createEcosystemDto
   * @returns Ecosystem creation success
   */
  async createEcosystem(createEcosystemDto: CreateEcosystemDto): Promise<IEcosystem> {
    const payload = { createEcosystemDto };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'create-ecosystem', payload);
  }
  /**
   *
   * @param userId
   * @returns All ecosystems from platform
   */
  async getAllEcosystems(userId: string): Promise<IEcosystem[]> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-all-ecosystems', { userId });
  }
  /**
   *
   * @param ecosystemId
   * @param orgId
   * @returns Ecosystem details by ecosystemId
   */
  async getEcosystemDashboard(ecosystemId: string, orgId: string): Promise<IEcosystemDashboard> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-ecosystem-dashboard', { ecosystemId, orgId });
  }
}
