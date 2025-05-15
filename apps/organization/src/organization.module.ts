import { Logger, Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'

import { ClientRegistrationService } from '@credebl/client-registration'
import { CommonModule } from '@credebl/common'
import { getNatsOptions } from '@credebl/common/nats.config'
import { KeycloakUrlService } from '@credebl/keycloak-url'
import { OrgRolesService } from '@credebl/org-roles'
import { PrismaService } from '@credebl/prisma-service'
import { UserActivityService } from '@credebl/user-activity'
import { UserOrgRolesService } from '@credebl/user-org-roles'
import { CacheModule } from '@nestjs/cache-manager'
import { UserRepository } from 'apps/user/repositories/user.repository'
import { OrgRolesRepository } from 'libs/org-roles/repositories'
import { UserActivityRepository } from 'libs/user-activity/repositories'
import { UserOrgRolesRepository } from 'libs/user-org-roles/repositories'
import { OrganizationRepository } from '../repositories/organization.repository'
import { OrganizationController } from './organization.controller'
import { OrganizationService } from './organization.service'

import { AwsService } from '@credebl/aws'
import { NATSClient } from '@credebl/common/NATSClient'
import { CommonConstants } from '@credebl/common/common.constant'
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module'
import { GlobalConfigModule } from '@credebl/config/global-config.module'
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule'
import { LoggerModule } from '@credebl/logger/logger.module'
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.ORGANIZATION_SERVICE, process.env.ORGANIZATION_NKEY_SEED),
      },
    ]),
    CommonModule,
    GlobalConfigModule,
    LoggerModule,
    PlatformConfig,
    ContextInterceptorModule,
    CacheModule.register(),
  ],
  controllers: [OrganizationController],
  providers: [
    OrganizationService,
    OrganizationRepository,
    PrismaService,
    Logger,
    OrgRolesService,
    UserOrgRolesService,
    OrgRolesRepository,
    UserActivityRepository,
    UserActivityRepository,
    UserOrgRolesRepository,
    UserRepository,
    UserActivityService,
    ClientRegistrationService,
    KeycloakUrlService,
    AwsService,
    NATSClient,
  ],
})
export class OrganizationModule {}
