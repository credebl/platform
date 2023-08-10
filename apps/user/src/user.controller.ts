import { UserEmailVerificationDto, userInfo } from '../interfaces/user.interface';

import { AcceptRejectInvitationDto } from '../dtos/accept-reject-invitation.dto';
import { Controller } from '@nestjs/common';
import { LoginUserDto } from '../dtos/login-user.dto';
import { MessagePattern } from '@nestjs/microservices';
import { UserService } from './user.service';
import { VerifyEmailTokenDto } from '../dtos/verify-email.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) { }

  /**
   * Description: Registers new user
   * @param payload Registration Details
   * @returns Get registered user response
   */
  @MessagePattern({ cmd: 'send-verification-mail' })
  async sendVerificationMail(payload: { userEmailVerificationDto: UserEmailVerificationDto }): Promise<object> {
    return this.userService.sendVerificationMail(payload.userEmailVerificationDto);
  }

  /**
   * Description: Verify user's email
   * @param param
   * @returns Get user's email verified
   */
  @MessagePattern({ cmd: 'user-email-verification' })
  async verifyEmail(payload: { param: VerifyEmailTokenDto }): Promise<object> {
    return this.userService.verifyEmail(payload.param);
  }

  @MessagePattern({ cmd: 'user-holder-login' })
  async login(payload: LoginUserDto): Promise<object> {
    return this.userService.login(payload);
  }

  @MessagePattern({ cmd: 'get-user-profile' })
  async getProfile(payload: { id }): Promise<object> {
    return this.userService.getProfile(payload);
  }

  @MessagePattern({ cmd: 'get-user-by-keycloak-id' })
  async findByKeycloakId(payload: { id }): Promise<object> {
    return this.userService.findByKeycloakId(payload);
  }

  @MessagePattern({ cmd: 'get-user-by-mail' })
  async findUserByEmail(payload: { email }): Promise<object> {
    return this.userService.findUserByEmail(payload);
  }

  @MessagePattern({ cmd: 'get-org-invitations' })
  async invitations(payload: { id; status; pageNumber; pageSize; search; }): Promise<object> {
    return this.userService.invitations(payload);
  }

  /**
   *
   * @param payload
   * @returns Organization invitation status  fetch-organization-users
   */
  @MessagePattern({ cmd: 'accept-reject-invitations' })
  async acceptRejectInvitations(payload: {
    acceptRejectInvitation: AcceptRejectInvitationDto;
    userId: number;
  }): Promise<string> {
    return this.userService.acceptRejectInvitations(payload.acceptRejectInvitation, payload.userId);
  }

  /**
   *
   * @param payload
   * @returns organization users list
   */
  @MessagePattern({ cmd: 'fetch-organization-users' })
  async get(payload: { orgId: number, pageNumber: number, pageSize: number, search: string }): Promise<object> {
    return this.userService.get(payload.orgId, payload.pageNumber, payload.pageSize, payload.search);
  }
  @MessagePattern({ cmd: 'check-user-exist' })
  async checkUserExist(payload: { userEmail: string }): Promise<string | object> {
    return this.userService.checkUserExist(payload.userEmail);
  }
  @MessagePattern({ cmd: 'add-user' })
  async addUserDetailsInKeyCloak(payload: { userEmail: string, userInfo: userInfo }): Promise<string | object> {
    return this.userService.createUserInKeyCloak(payload.userEmail, payload.userInfo);
  }

  // Fetch Users recent activities
  @MessagePattern({ cmd: 'get-user-activity' })
  async getUserActivity(payload: { userId: number, limit: number }): Promise<object[]> {
    return this.userService.getUserActivity(payload.userId, payload.limit);
  }

}
