import { ClientsModule, Transport } from '@nestjs/microservices';

import { AgentService } from '../agent/agent.service';
import { AuthzController } from './authz.controller';
import { AuthzService } from './authz.service';
import { CommonModule } from '../../../../libs/common/src/common.module';
import { CommonService } from '../../../../libs/common/src/common.service';
import { ConnectionService } from '../connection/connection.service';
import { HttpModule } from '@nestjs/axios';
import { JwtStrategy } from './jwt.strategy';
import { MobileJwtStrategy } from './mobile-jwt.strategy';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SocketGateway } from './socket.gateway';
import { SupabaseService } from '@credebl/supabase';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';
import { VerificationService } from '../verification/verification.service';
import { getNatsOptions } from '@credebl/common/nats.config';
import { OrganizationService } from '../organization/organization.service';
import { CommonConstants } from '@credebl/common/common.constant';

@Module({
  imports: [
    HttpModule,
    PassportModule.register({
      defaultStrategy: 'jwt',
      mobileStrategy: 'mobile-jwt'
    }),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.AUTH_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
      },
      CommonModule
    ]),
    UserModule
  ],
  providers: [
    JwtStrategy,
    AuthzService,
    MobileJwtStrategy,
    SocketGateway,
    VerificationService,
    ConnectionService,
    AgentService,
    CommonService,
    UserService,
    SupabaseService,
    OrganizationService
  ],
  exports: [
    PassportModule,
    AuthzService
  ],
  controllers: [AuthzController]
})
export class AuthzModule { }