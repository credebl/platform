import { Inject } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
import { AcceptRejectInvitationDto } from './dto/accept-reject-invitation.dto';
import { GetAllInvitationsDto } from './dto/get-all-invitations.dto';
import { GetAllUsersDto } from './dto/get-all-users.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { AddPasskeyDetails } from './dto/add-user.dto';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';

@Injectable()
export class UserService extends BaseService {
  constructor(@Inject('NATS_CLIENT') private readonly serviceProxy: ClientProxy) {
    super('User Service');
  }

  async getProfile(id: string): Promise<{ response: object }> {
    const payload = { id };
    return this.sendNats(this.serviceProxy, 'get-user-profile', payload);
  }

  async updateUserProfile(updateUserProfileDto: UpdateUserProfileDto): Promise<{ response: object }> {
    const payload = { updateUserProfileDto };
    return this.sendNats(this.serviceProxy, 'update-user-profile', payload);
  }
  
  async getPublicProfile(id: number): Promise<{ response: object }> {
    const payload = { id };
    try {
      return this.sendNats(this.serviceProxy, 'get-user-public-profile', payload);
    } catch (error) {
      this.logger.error(`Error in get user:${JSON.stringify(error)}`);
    }
  }

  async findUserByKeycloakId(id: string): Promise<{ response: object }> {
    const payload = { id };
    return this.sendNats(this.serviceProxy, 'get-user-by-supabase', payload);
  }


  async invitations(id: string, status: string, getAllInvitationsDto: GetAllInvitationsDto): Promise<{ response: object }> {
    const { pageNumber, pageSize, search } = getAllInvitationsDto;
    const payload = { id, status, pageNumber, pageSize, search };
    return this.sendNats(this.serviceProxy, 'get-org-invitations', payload);
  }

  async acceptRejectInvitaion(
    acceptRejectInvitation: AcceptRejectInvitationDto,
    userId: string
  ): Promise<{ response: string }> {
    const payload = { acceptRejectInvitation, userId };
    return this.sendNats(this.serviceProxy, 'accept-reject-invitations', payload);
  }

  async get(
    getAllUsersDto: GetAllUsersDto
  ): Promise<{ response: object }> {
    const { pageNumber, pageSize, search } = getAllUsersDto;
    const payload = { pageNumber, pageSize, search };
    return this.sendNats(this.serviceProxy, 'fetch-users', payload);
  }

  async checkUserExist(userEmail: string): Promise<{ response: string }> {
    const payload = { userEmail };
    return this.sendNats(this.serviceProxy, 'check-user-exist', payload);
  }

  async getUserActivities(userId: string, limit: number): Promise<{ response: object }> {
    const payload = { userId, limit };
    return this.sendNats(this.serviceProxy, 'get-user-activity', payload);
  }

  async addPasskey(userEmail: string, userInfo: AddPasskeyDetails): Promise<{ response: string }> {
    const payload = { userEmail, userInfo };
    return this.sendNats(this.serviceProxy, 'add-passkey', payload);
  }

  async updatePlatformSettings(platformSettings: UpdatePlatformSettingsDto): Promise<{ response: string }> {
    const payload = { platformSettings };
    return this.sendNats(this.serviceProxy, 'update-platform-settings', payload);
  }

  async getPlatformSettings(): Promise<{ response: object }> {
    return this.sendNats(this.serviceProxy, 'fetch-platform-settings', '');
  }
}
