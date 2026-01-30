import { Injectable, Inject, HttpException } from '@nestjs/common';
import { BaseService } from '../../../../libs/service/base.service';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { UserEmailVerificationDto } from '../user/dto/create-user.dto';
import { EmailVerificationDto } from '../user/dto/email-verify.dto';
import { AddUserDetailsDto } from '../user/dto/add-user.dto';
import {
  IClientAliases,
  IResetPasswordResponse,
  ISignInUser,
  ISignUpUserResponse,
  IVerifyUserEmail
} from '@credebl/common/interfaces/user.interface';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetTokenPasswordDto } from './dtos/reset-token-password';
import { NATSClient } from '@credebl/common/NATSClient';
import { user } from '@prisma/client';
import { IRestrictedUserSession, ISessionDetails } from 'apps/user/interfaces/user.interface';
import { UserLogoutDto } from './dtos/user-logout.dto';
import type { Prisma } from '@prisma/client';
import { ClientProxy } from '@nestjs/microservices';
@Injectable()
@WebSocketGateway()
export class AuthzService extends BaseService {
  //private logger = new Logger('AuthService');
  @WebSocketServer() server;
  constructor(
    @Inject('NATS_CLIENT') private readonly authServiceProxy: ClientProxy,
    private readonly natsClient: NATSClient
  ) {
    super('AuthzService');
  }

  getClientAlias(): Promise<IClientAliases[]> {
    return this.natsClient.sendNatsMessage(this.authServiceProxy, 'get-client-alias-and-url', '');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getUserByKeycloakUserId(keycloakUserId: string): Promise<any> {
    return this.natsClient.sendNats(this.authServiceProxy, 'get-user-by-keycloakUserId', keycloakUserId);
  }

  async sendVerificationMail(userEmailVerification: UserEmailVerificationDto): Promise<user> {
    const payload = { userEmailVerification };
    return this.natsClient.sendNatsMessage(this.authServiceProxy, 'send-verification-mail', payload);
  }

  async verifyEmail(param: EmailVerificationDto): Promise<IVerifyUserEmail> {
    const payload = { param };
    return this.natsClient.sendNatsMessage(this.authServiceProxy, 'user-email-verification', payload);
  }

  async login(clientInfo: Prisma.JsonValue, email: string, password?: string, isPasskey = false): Promise<ISignInUser> {
    const payload = { email, password, isPasskey, clientInfo };
    return this.natsClient.sendNatsMessage(this.authServiceProxy, 'user-holder-login', payload);
  }

  async getSession(sessionId): Promise<ISessionDetails> {
    const payload = { ...sessionId };
    return this.natsClient.sendNatsMessage(this.authServiceProxy, 'fetch-session-details', payload);
  }

  async checkSession(sessionId): Promise<ISessionDetails> {
    return this.natsClient.sendNatsMessage(this.authServiceProxy, 'check-session-details', sessionId);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<IResetPasswordResponse> {
    return this.natsClient.sendNatsMessage(this.authServiceProxy, 'user-reset-password', resetPasswordDto);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<IResetPasswordResponse> {
    return this.natsClient.sendNatsMessage(this.authServiceProxy, 'user-forgot-password', forgotPasswordDto);
  }

  async resetNewPassword(resetTokenPasswordDto: ResetTokenPasswordDto): Promise<IResetPasswordResponse> {
    return this.natsClient.sendNatsMessage(this.authServiceProxy, 'user-set-token-password', resetTokenPasswordDto);
  }

  async refreshToken(refreshToken: string): Promise<ISignInUser> {
    return this.natsClient.sendNatsMessage(this.authServiceProxy, 'refresh-token-details', refreshToken);
  }

  async userSessions(userId: string): Promise<IRestrictedUserSession[]> {
    return this.natsClient.sendNatsMessage(this.authServiceProxy, 'session-details-by-userId', userId);
  }

  async deleteSession(sessionId: string, userId: string): Promise<{ message: string }> {
    try {
      return await this.natsClient.sendNatsMessage(this.authServiceProxy, 'delete-session-by-sessionId', {
        sessionId,
        userId
      });
    } catch (error) {
      if (error?.response && error?.status) {
        throw new HttpException(error.response, error.status);
      }
      throw error;
    }
  }

  async addUserDetails(userInfo: AddUserDetailsDto): Promise<ISignUpUserResponse> {
    const payload = { userInfo };
    return this.natsClient.sendNatsMessage(this.authServiceProxy, 'add-user', payload);
  }

  async logout(logoutUserDto: UserLogoutDto): Promise<string> {
    return this.natsClient.sendNatsMessage(this.authServiceProxy, 'user-logout', logoutUserDto);
  }
}
