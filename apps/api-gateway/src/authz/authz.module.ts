import { ClientsModule, Transport } from '@nestjs/microservices';
import { Logger, Module } from '@nestjs/common';

import { AgentService } from '../agent/agent.service';
import { AuthzController } from './authz.controller';
import { AuthzService } from './authz.service';
import { CommonConstants } from '@credebl/common/common.constant';
import { CommonModule } from '../../../../libs/common/src/common.module';
import { CommonService } from '../../../../libs/common/src/common.service';
import { ConnectionService } from '../connection/connection.service';
import { HttpModule } from '@nestjs/axios';
import { JwtStrategy } from './jwt.strategy';
import { MobileJwtStrategy } from './mobile-jwt.strategy';
import { NATSClient } from '@credebl/common/NATSClient';
import { OrganizationService } from '../organization/organization.service';
import { PassportModule } from '@nestjs/passport';
import { PrismaServiceModule } from '@credebl/prisma-service';
import { SocketGateway } from './socket.gateway';
import { SupabaseService } from '@credebl/supabase';
import { UserModule } from '../user/user.module';
import { UserRepository } from 'apps/user/repositories/user.repository';
import { UserService } from '../user/user.service';
import { VerificationService } from '../verification/verification.service';
import { getNatsOptions } from '@credebl/common/nats.config';
import { OrgRolesGuard } from './guards/org-roles.guard';
import { OrganizationModule } from '../organization/organization.module';
import { RolesGuard } from './roles.guard';
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
    UserModule,
    OrganizationModule,
    PrismaServiceModule
  ],
  providers: [
    JwtStrategy,
    AuthzService,
    MobileJwtStrategy,
    SocketGateway,
    NATSClient,
    VerificationService,
    ConnectionService,
    AgentService,
    CommonService,
    UserService,
    SupabaseService,
    OrganizationService,
    UserRepository,
    Logger,
    OrgRolesGuard,
    RolesGuard
  ],
  exports: [PassportModule, AuthzService, OrgRolesGuard, RolesGuard],
  controllers: [AuthzController]
})
export class AuthzModule {}
