import { Inject } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
import { AcceptRejectInvitationDto } from './dto/accept-reject-invitation.dto';
import { UserEmailVerificationDto } from './dto/create-user.dto';
import { EmailVerificationDto } from './dto/email-verify.dto';
import { GetAllInvitationsDto } from './dto/get-all-invitations.dto';
import { AddUserDetails } from './dto/login-user.dto';
import { GetAllUsersDto } from './dto/get-all-users.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@Injectable()
export class UserService extends BaseService {
  constructor(@Inject('NATS_CLIENT') private readonly serviceProxy: ClientProxy) {
    super('User Service');
  }

  async sendVerificationMail(userEmailVerificationDto: UserEmailVerificationDto): Promise<object> {
    try {
      const payload = { userEmailVerificationDto };
      return this.sendNats(this.serviceProxy, 'send-verification-mail', payload);
    } catch (error) {
      throw new RpcException(error.response);
    }
  }

  async login(email: string, password?: string, isPasskey = false): Promise<{ response: object }> {
    try {
      const payload = { email, password, isPasskey };
      return this.sendNats(this.serviceProxy, 'user-holder-login', payload);
    } catch (error) {
      throw new RpcException(error.response);
    }
  }
  async verifyEmail(param: EmailVerificationDto): Promise<object> {
    try {
      const payload = { param };
      return this.sendNats(this.serviceProxy, 'user-email-verification', payload);
    } catch (error) {
      throw new RpcException(error.response);
    }
  }

  async getProfile(id: number): Promise<{ response: object }> {
    const payload = { id };
    try {
      return this.sendNats(this.serviceProxy, 'get-user-profile', payload);
    } catch (error) {
      this.logger.error(`Error in get user:${JSON.stringify(error)}`);
    }
  }

  async updateUserProfile(updateUserProfileDto: UpdateUserProfileDto): Promise<{ response: object }> {
    const payload = {updateUserProfileDto };
    try {
      return this.sendNats(this.serviceProxy, 'update-user-profile', payload);
    } catch (error) {
      throw new RpcException(error.response);
    }
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

    try {
      return this.sendNats(this.serviceProxy, 'get-user-by-supabase', payload);
    } catch (error) {
      this.logger.error(`Error in get user:${JSON.stringify(error)}`);
    }
  }


  async invitations(id: number, status: string, getAllInvitationsDto: GetAllInvitationsDto): Promise<{ response: object }> {
    const {pageNumber, pageSize, search} = getAllInvitationsDto;
    const payload = { id, status, pageNumber, pageSize, search };
    return this.sendNats(this.serviceProxy, 'get-org-invitations', payload);
  }

  async acceptRejectInvitaion(
    acceptRejectInvitation: AcceptRejectInvitationDto,
    userId: number
  ): Promise<{ response: string }> {
    const payload = { acceptRejectInvitation, userId };
    return this.sendNats(this.serviceProxy, 'accept-reject-invitations', payload);
  }

  async getOrgUsers(
    orgId: number,
    getAllUsersDto: GetAllUsersDto
  ): Promise<{ response: object }> {
    const {pageNumber, pageSize, search} = getAllUsersDto;
    const payload = { orgId, pageNumber, pageSize, search };
    return this.sendNats(this.serviceProxy, 'fetch-organization-users', payload);
  }

  async get(
    getAllUsersDto: GetAllUsersDto
  ): Promise<{ response: object }> {
    const {pageNumber, pageSize, search} = getAllUsersDto;
    const payload = { pageNumber, pageSize, search };
    return this.sendNats(this.serviceProxy, 'fetch-users', payload);
  }
  
  async checkUserExist(userEmail: string): Promise<{ response: string }> {
    const payload = { userEmail };
    return this.sendNats(this.serviceProxy, 'check-user-exist', payload);
  }

  async addUserDetailsInKeyCloak(userEmail: string, userInfo:AddUserDetails): Promise<{ response: string }> {
    const payload = { userEmail, userInfo };
    return this.sendNats(this.serviceProxy, 'add-user', payload);
  }

  async getUserActivities(userId: number, limit: number): Promise<{ response: object }> {
    const payload = { userId, limit };
    return this.sendNats(this.serviceProxy, 'get-user-activity', payload);
  }
}
