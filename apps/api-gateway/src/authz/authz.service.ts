import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from '../../../../libs/service/base.service';
import {
  WebSocketGateway,
  WebSocketServer

} from '@nestjs/websockets';


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

}
