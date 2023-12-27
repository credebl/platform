import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from '../../../../libs/service/base.service';
import {
  WebSocketGateway,
  WebSocketServer

} from '@nestjs/websockets';
import { UserEmailVerificationDto } from '../user/dto/create-user.dto';
import { EmailVerificationDto } from '../user/dto/email-verify.dto';
import { AddUserDetailsDto } from '../user/dto/add-user.dto';
import { ISendVerificationEmail, ISignInUser, IVerifyUserEmail } from '@credebl/common/interfaces/user.interface';

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

  async addUserDetails(userInfo: AddUserDetailsDto): Promise<string> {
    const payload = { userInfo };
    return this.sendNatsMessage(this.authServiceProxy, 'add-user', payload);
  }
}