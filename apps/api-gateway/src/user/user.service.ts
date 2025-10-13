import { Inject, Injectable } from '@nestjs/common';
import { BaseService } from 'libs/service/base.service';
import { AcceptRejectInvitationDto } from './dto/accept-reject-invitation.dto';
import { GetAllInvitationsDto } from './dto/get-all-invitations.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { AddPasskeyDetailsDto } from './dto/add-user.dto';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';
import { IUsersProfile, ICheckUserDetails } from 'apps/user/interfaces/user.interface';
import { IUsersActivity } from 'libs/user-activity/interface';
import { IUserInvitations } from '@credebl/common/interfaces/user.interface';
import { user } from '@prisma/client';
import { PaginationDto } from '@credebl/common/dtos/pagination.dto';
import { NATSClient } from '@credebl/common/NATSClient';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class UserService extends BaseService {
  constructor(
    @Inject('NATS_CLIENT') private readonly serviceProxy: ClientProxy,
    private readonly natsClient: NATSClient
  ) {
    super('User Service');
  }

  async getProfile(id: string): Promise<IUsersProfile> {
    const payload = { id };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-user-profile', payload);
  }

  async getPublicProfile(username: string): Promise<object> {
    const payload = { username };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-user-public-profile', payload);
  }

  async updateUserProfile(updateUserProfileDto: UpdateUserProfileDto): Promise<user> {
    const payload = { updateUserProfileDto };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'update-user-profile', payload);
  }

  async findUserinSupabase(id: string): Promise<object> {
    const payload = { id };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-user-by-supabase', payload);
  }

  async findUserinKeycloak(id: string): Promise<object> {
    const payload = { id };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-user-by-keycloak', payload);
  }

  async invitations(id: string, status: string, getAllInvitationsDto: GetAllInvitationsDto): Promise<IUserInvitations> {
    const { pageNumber, pageSize, search } = getAllInvitationsDto;
    const payload = { id, status, pageNumber, pageSize, search };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-org-invitations', payload);
  }

  async acceptRejectInvitaion(acceptRejectInvitation: AcceptRejectInvitationDto, userId: string): Promise<string> {
    const payload = { acceptRejectInvitation, userId };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'accept-reject-invitations', payload);
  }

  async get(paginationDto: PaginationDto): Promise<object> {
    const { pageNumber, pageSize, search } = paginationDto;
    const payload = { pageNumber, pageSize, search };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'fetch-users', payload);
  }

  async checkUserExist(userEmail: string): Promise<ICheckUserDetails> {
    const payload = { userEmail };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'check-user-exist', payload);
  }

  async getUserActivities(userId: string, limit: number): Promise<IUsersActivity[]> {
    const payload = { userId, limit };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-user-activity', payload);
  }

  async addPasskey(userEmail: string, userInfo: AddPasskeyDetailsDto): Promise<string> {
    const payload = { userEmail, userInfo };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'add-passkey', payload);
  }

  async updatePlatformSettings(platformSettings: UpdatePlatformSettingsDto): Promise<string> {
    const payload = { platformSettings };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'update-platform-settings', payload);
  }

  async getPlatformSettings(): Promise<object> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'fetch-platform-settings', '');
  }

  async getUserByUserIdInKeycloak(email: string): Promise<object> {
    const payload = { email };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-user-info-by-user-email-keycloak', payload);
  }
}
