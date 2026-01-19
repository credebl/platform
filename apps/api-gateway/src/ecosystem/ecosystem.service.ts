import { NATSClient } from '@credebl/common/NATSClient';
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { EcosystemOrgStatus, Invitation } from '@credebl/enum/enum';
import {
  IEcosystem,
  IEcosystemDashboard,
  IEcosystemInvitation,
  IEcosystemInvitations,
  IEcosystemMemberInvitations
} from 'apps/ecosystem/interfaces/ecosystem.interfaces';
import { CreateEcosystemDto } from 'apps/ecosystem/dtos/create-ecosystem-dto';
// eslint-disable-next-line camelcase
import { ecosystem_orgs, user } from '@prisma/client';

@Injectable()
export class EcosystemService {
  constructor(
    @Inject('NATS_CLIENT') private readonly serviceProxy: ClientProxy,
    private readonly natsClient: NATSClient
  ) {}

  /**
   *
   * @param createEcosystemInvitationDto
   * @returns Ecosystem creation success
   */
  async inviteUserToCreateEcosystem(email: string, platformAdminId: string): Promise<IEcosystemInvitations> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'invite-user-for-ecosystem-creation', {
      email,
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
  async getAllEcosystems(): Promise<IEcosystem[]> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-all-ecosystems', {});
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

  async inviteMemberToEcosystem(orgId: string, reqUser: string, ecosystemId: string): Promise<boolean> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'invite-member-to-ecosystem', {
      orgId,
      reqUser,
      ecosystemId
    });
  }

  async updateEcosystemInvitationStatus(status: Invitation, reqUser: string, ecosystemId: string): Promise<boolean> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'update-ecosystem-invitation-status', {
      status,
      reqUser,
      ecosystemId
    });
  }

  async deleteEcosystemOrgs(ecosystemId: string, userIds: string[]): Promise<{ count: number }> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'delete-ecosystem-orgs', { userIds, ecosystemId });
  }

  async updateEcosystemOrgStatus(
    ecosystemId: string,
    userIds: string[],
    status: EcosystemOrgStatus
  ): Promise<{ count: number }> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'update-ecosystem-org-status', {
      userIds,
      ecosystemId,
      status
    });
  }

  // eslint-disable-next-line camelcase
  async getAllEcosystemOrgsByEcosystemId(ecosystemId: string): Promise<ecosystem_orgs[]> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-ecosystem-orgs', { ecosystemId });
  }

  // eslint-disable-next-line camelcase
  async getEcosystemMemberInvitations(payload: IEcosystemMemberInvitations): Promise<IEcosystemInvitation[]> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-ecosystem-member-invitations', payload);
  }

  async getUserByKeycloakId(keycloakId: string): Promise<user> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-user-by-keycloak-id', { keycloakId });
  }

  async getEcosystemDetailsByUserId(userId: string): Promise<user> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-ecosystem-details-by-userid', { userId });
  }

  async getEcosystemOrgDetailsByUserId(userId: string, ecosystemId: string): Promise<user> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-ecosystem-org-details-by-userid', {
      userId,
      ecosystemId
    });
  }
}
