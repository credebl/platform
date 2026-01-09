import { ClientsModule, Transport } from '@nestjs/microservices';
import { Logger, Module } from '@nestjs/common';
import { OrgRolesModule, OrgRolesService } from '@credebl/org-roles';

import { AwsService } from '@credebl/aws';
import { ClientRegistrationService } from '@credebl/client-registration';
import { CommonConstants } from '@credebl/common/common.constant';
import { CommonModule } from '@credebl/common';
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule';
import { FidoModule } from './fido/fido.module';
import { GlobalConfigModule } from '@credebl/config/global-config.module';
import { KeycloakUrlService } from '@credebl/keycloak-url';
import { LoggerModule } from '@credebl/logger/logger.module';
import { NATSClient } from '@credebl/common/NATSClient';
import { OrgRolesRepository } from 'libs/org-roles/repositories';
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module';
import { PrismaService } from '@credebl/prisma-service';
import { SupabaseService } from '@credebl/supabase';
import { UserActivityRepository } from 'libs/user-activity/repositories';
import { UserActivityService } from '@credebl/user-activity';
import { UserController } from './user.controller';
import { UserDevicesRepository } from '../repositories/user-device.repository';
import { UserOrgRolesRepository } from 'libs/user-org-roles/repositories';
import { UserOrgRolesService } from '@credebl/user-org-roles';
import { UserRepository } from '../repositories/user.repository';
import { UserService } from './user.service';
import { getNatsOptions } from '@credebl/common/nats.config';

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
    LoggerModule,
    PlatformConfig,
    ContextInterceptorModule,
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
  ],
  exports: [UserRepository]
})
export class UserModule {}
