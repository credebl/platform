import { NATSClient } from '@credebl/common/NATSClient';
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SendEcosystemCreateDto } from './dtos/send-ecosystem-invitation';
import { IEcosystemInvitations } from 'apps/ecosystem/interfaces/ecosystem.interfaces';
import { Invitation } from '@credebl/enum/enum';

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
  async inviteUserToCreateEcosystem(dto: SendEcosystemCreateDto, userId: string): Promise<IEcosystemInvitations> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'invite-user-for-ecosystem-creation', {
      email: dto.email,
      userId
    });
  }

  async getInvitationsByUserId(userId: string): Promise<IEcosystemInvitations[]> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-ecosystem-invitations-by-user', { userId });
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
  //
  async inviteMemberToEcosystem(orgId: string): Promise<boolean> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'invite-member-to-ecosystem', { orgId });
  }

  async updateEcosystemInvitationStatus(email: string, status: Invitation): Promise<boolean> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'update-ecosystem-invitation-status', { email, status });
  }
}
