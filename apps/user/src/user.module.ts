import { OrgRolesModule, OrgRolesService } from '@credebl/org-roles'
import { Logger, Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'

import { AwsService } from '@credebl/aws'
import { ClientRegistrationService } from '@credebl/client-registration'
import { CommonModule } from '@credebl/common'
import { NATSClient } from '@credebl/common/NATSClient'
import { CommonConstants } from '@credebl/common/common.constant'
import { getNatsOptions } from '@credebl/common/nats.config'
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module'
import { GlobalConfigModule } from '@credebl/config/global-config.module'
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule'
import { KeycloakUrlService } from '@credebl/keycloak-url'
import { LoggerModule } from '@credebl/logger/logger.module'
import { PrismaService } from '@credebl/prisma-service'
import { SupabaseService } from '@credebl/supabase'
import { UserActivityService } from '@credebl/user-activity'
import { UserOrgRolesService } from '@credebl/user-org-roles'
import { OrgRolesRepository } from 'libs/org-roles/repositories'
import { UserActivityRepository } from 'libs/user-activity/repositories'
import { UserOrgRolesRepository } from 'libs/user-org-roles/repositories'
import { UserDevicesRepository } from '../repositories/user-device.repository'
import { UserRepository } from '../repositories/user.repository'
import { FidoModule } from './fido/fido.module'
import { UserController } from './user.controller'
import { UserService } from './user.service'

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.USER_SERVICE, process.env.USER_NKEY_SEED),
      },
    ]),

    CommonModule,
    GlobalConfigModule,
    LoggerModule,
    PlatformConfig,
    ContextInterceptorModule,
    FidoModule,
    OrgRolesModule,
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
    NATSClient,
  ],
})
export class UserModule {}
