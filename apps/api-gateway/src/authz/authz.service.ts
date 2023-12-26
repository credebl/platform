import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from '../../../../libs/service/base.service';
import {
  WebSocketGateway,
  WebSocketServer

} from '@nestjs/websockets';
import { UserEmailVerificationDto } from '../user/dto/create-user.dto';
import { EmailVerificationDto } from '../user/dto/email-verify.dto';
import { AddUserDetails } from '../user/dto/add-user.dto';


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

  async sendVerificationMail(userEmailVerification: UserEmailVerificationDto): Promise<UserEmailVerificationDto> {
    const payload = { userEmailVerification };
    return this.sendNatsMessage(this.authServiceProxy, 'send-verification-mail', payload);
  }

  async verifyEmail(param: EmailVerificationDto): Promise<EmailVerificationDto> {
    const payload = { param };
    return this.sendNatsMessage(this.authServiceProxy, 'user-email-verification', payload);
  }

  async login(email: string, password?: string, isPasskey = false): Promise<{ response: object }> {
    const payload = { email, password, isPasskey };
    return this.sendNats(this.authServiceProxy, 'user-holder-login', payload);
  }

  async addUserDetails(userInfo: AddUserDetails): Promise<{ response: string }> {
    const payload = { userInfo };
    return this.sendNats(this.authServiceProxy, 'add-user', payload);
  }
}