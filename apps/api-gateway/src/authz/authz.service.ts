import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from '../../../../libs/service/base.service';
import {
  WebSocketGateway,
  WebSocketServer

} from '@nestjs/websockets';
import { UserEmailVerificationDto } from '../user/dto/create-user.dto';
import { EmailVerificationDto } from '../user/dto/email-verify.dto';
import { AddUserDetailsDto, AddUserDetailsUsernameBasedDto } from '../user/dto/add-user.dto';
import { IResetPasswordResponse, ISendVerificationEmail, ISignInUser, ISignUpUserResponse, IVerifyUserEmail } from '@credebl/common/interfaces/user.interface';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetTokenPasswordDto } from './dtos/reset-token-password';

@Injectable()
@WebSocketGateway()
export class AuthzService extends BaseService {
  //private logger = new Logger('AuthService');
  @WebSocketServer() server;
  constructor(
    @Inject('NATS_CLIENT') private readonly authServiceProxy: ClientProxy
  ) {

    super('AuthzService');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getUserByKeycloakUserId(keycloakUserId: string): Promise<any> {
    return this.sendNats(this.authServiceProxy, 'get-user-by-keycloakUserId', keycloakUserId);
  }

  async sendVerificationMail(userEmailVerification: UserEmailVerificationDto): Promise<ISendVerificationEmail> {
    const payload = { userEmailVerification };
    return this.sendNatsMessage(this.authServiceProxy, 'send-verification-mail', payload);
  }

  async verifyEmail(param: EmailVerificationDto): Promise<IVerifyUserEmail> {
    const payload = { param };
    return this.sendNatsMessage(this.authServiceProxy, 'user-email-verification', payload);
  }

  async login(email: string, password?: string, isPasskey = false): Promise<ISignInUser> {
    const payload = { email, password, isPasskey };
    return this.sendNatsMessage(this.authServiceProxy, 'user-holder-login', payload);
  }

  async usernameLogin(username: string, password?: string, isPasskey = false): Promise<ISignInUser> {
    const payload = { username, password, isPasskey };
    return this.sendNatsMessage(this.authServiceProxy, 'username-holder-login', payload);
  }
  
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<IResetPasswordResponse> {
    return this.sendNatsMessage(this.authServiceProxy, 'user-reset-password', resetPasswordDto);
  }
  
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<IResetPasswordResponse> {
    return this.sendNatsMessage(this.authServiceProxy, 'user-forgot-password', forgotPasswordDto);
  }

  async resetNewPassword(resetTokenPasswordDto: ResetTokenPasswordDto): Promise<IResetPasswordResponse> {
    return this.sendNatsMessage(this.authServiceProxy, 'user-set-token-password', resetTokenPasswordDto);
  }

  async refreshToken(refreshToken: string): Promise<ISignInUser> {
    return this.sendNatsMessage(this.authServiceProxy, 'refresh-token-details', refreshToken);
  }

  async addUserDetails(userInfo: AddUserDetailsDto): Promise<ISignUpUserResponse> {
    const payload = { userInfo };
    return this.sendNatsMessage(this.authServiceProxy, 'add-user', payload);
  }

  async addUserDetailsUsernameBased(userInfo: AddUserDetailsUsernameBasedDto): Promise<ISignUpUserResponse> {
    const payload = { userInfo };
    return this.sendNatsMessage(this.authServiceProxy, 'add-user-username-based', payload);
  }
}