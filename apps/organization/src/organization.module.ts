import { ClientsModule, Transport } from '@nestjs/microservices';
import { Logger, Module } from '@nestjs/common';

import { CommonModule } from '@credebl/common';
import { OrgRolesRepository } from '@credebl/user-management';
import { OrgRolesService } from '@credebl/user-management';
import { OrganizationController } from './organization.controller';
import { OrganizationRepository } from '../repositories/organization.repository';
import { OrganizationService } from './organization.service';
import { PrismaService } from '@credebl/prisma-service';
import {
  UserActivityRepository,
  UserActivityService,
  UserOrgRolesRepository,
  UserOrgRolesService
} from '@credebl/user-management';
import { UserRepository } from 'apps/user/repositories/user.repository';
import { CacheModule } from '@nestjs/cache-manager';
import { getNatsOptions } from '@credebl/common/nats.config';
import { ClientRegistrationService } from '@credebl/client-registration';
import { KeycloakUrlService } from '@credebl/keycloak-url';

import { AwsService } from '@credebl/aws';
import { CommonConstants } from '@credebl/common/common.constant';
import { GlobalConfigModule } from '@credebl/common/global-config.module';
import { ConfigModule as PlatformConfig } from '@credebl/config';
import { LoggerModule } from '@credebl/logger/logger.module';
import { ContextInterceptorModule } from '@credebl/common/utils/context/contextInterceptorModule';
import { NATSClient } from '@credebl/common/NATSClient';
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(
          CommonConstants.ORGANIZATION_SERVICE,
          process.env.ORGANIZATION_NKEY_SEED,
          process.env.NATS_CREDS_FILE
        )
      }
    ]),
    CommonModule,
    GlobalConfigModule,
    LoggerModule,
    PlatformConfig,
    ContextInterceptorModule,
    CacheModule.register()
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
    NATSClient
  ],
  exports: [OrganizationRepository]
})
export class OrganizationModule {}
