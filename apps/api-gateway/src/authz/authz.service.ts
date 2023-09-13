import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
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

  async sendVerificationMail(userEmailVerificationDto: UserEmailVerificationDto): Promise<object> {
    try {
      const payload = { userEmailVerificationDto };
      return await this.sendNats(this.authServiceProxy, 'send-verification-mail', payload);
    } catch (error) {
      throw new RpcException(error.response);
    }
  }

  async verifyEmail(param: EmailVerificationDto): Promise<object> {
    try {
      const payload = { param };
      return await this.sendNats(this.authServiceProxy, 'user-email-verification', payload);
    } catch (error) {
      throw new RpcException(error.response);
    }
  }

  async login(email: string, password?: string, isPasskey = false): Promise<{ response: object }> {
    const payload = { email, password, isPasskey };
    return this.sendNats(this.authServiceProxy, 'user-holder-login', payload);
  }

  async addUserDetailsInKeyCloak(userInfo: AddUserDetails): Promise<{ response: string }> {
    const payload = { userInfo };
    return this.sendNats(this.authServiceProxy, 'add-user', payload);
  }
}