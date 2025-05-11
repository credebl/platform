import { ClientsModule, Transport } from '@nestjs/microservices';
import { Logger, Module } from '@nestjs/common';
import { OrgRolesModule, OrgRolesService } from '@credebl/org-roles';

import { ClientRegistrationService } from '@credebl/client-registration';
import { CommonModule } from '@credebl/common';
import { FidoModule } from './fido/fido.module';
import { KeycloakUrlService } from '@credebl/keycloak-url';
import { OrgRolesRepository } from 'libs/org-roles/repositories';
import { PrismaService } from '@credebl/prisma-service';
import { SupabaseService } from '@credebl/supabase';
import { UserActivityRepository } from 'libs/user-activity/repositories';
import { UserActivityService } from '@credebl/user-activity';
import { UserController } from './user.controller';
import { UserOrgRolesRepository } from 'libs/user-org-roles/repositories';
import { UserOrgRolesService } from '@credebl/user-org-roles';
import { UserRepository } from '../repositories/user.repository';
import { UserService } from './user.service';
import { UserDevicesRepository } from '../repositories/user-device.repository';
import { getNatsOptions } from '@credebl/common/nats.config';
import { AwsService } from '@credebl/aws';
import { CommonConstants } from '@credebl/common/common.constant';
import { GlobalConfigModule } from '@credebl/config/global-config.module';
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module';
import { LoggerModule } from '@credebl/logger/logger.module';
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule';
import { NATSClient } from '@credebl/common/NATSClient';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.USER_SERVICE, process.env.USER_NKEY_SEED)
      }
    ]),
    
    CommonModule,
    GlobalConfigModule,
    LoggerModule, PlatformConfig, ContextInterceptorModule,
    FidoModule,
    OrgRolesModule
],
  controllers: [UserController],
  providers: [
    AwsService,
    UserService,
    UserRepository,
    PrismaService,
    Logger,
    ClientRegistrationService,
    SupabaseService,
    KeycloakUrlService,
    OrgRolesService,
    UserOrgRolesService,
    OrgRolesRepository,
    UserOrgRolesRepository,
    UserActivityService,
    UserActivityRepository,
    UserDevicesRepository,
    NATSClient
  ]
})
export class UserModule {}
