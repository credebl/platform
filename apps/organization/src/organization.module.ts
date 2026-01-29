import { ClientsModule, Transport } from '@nestjs/microservices';
import { Logger, Module } from '@nestjs/common';

import { AwsService } from '@credebl/aws';
import { CacheModule } from '@nestjs/cache-manager';
import { ClientRegistrationService } from '@credebl/client-registration';
import { CommonConstants } from '@credebl/common/common.constant';
import { CommonModule } from '@credebl/common';
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule';
import { GlobalConfigModule } from '@credebl/config/global-config.module';
import { KeycloakUrlService } from '@credebl/keycloak-url';
import { LoggerModule } from '@credebl/logger/logger.module';
import { NATSClient } from '@credebl/common/NATSClient';
import { OrgRolesRepository } from 'libs/org-roles/repositories';
import { OrgRolesService } from '@credebl/org-roles';
import { OrganizationController } from './organization.controller';
import { OrganizationRepository } from '../repositories/organization.repository';
import { OrganizationService } from './organization.service';
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module';
import { PrismaService } from '@credebl/prisma-service';
import { UserActivityRepository } from 'libs/user-activity/repositories';
import { UserActivityService } from '@credebl/user-activity';
import { UserOrgRolesRepository } from 'libs/user-org-roles/repositories';
import { UserOrgRolesService } from '@credebl/user-org-roles';
import { UserRepository } from 'apps/user/repositories/user.repository';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.ORGANIZATION_SERVICE, process.env.NATS_CREDS_FILE)
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
  ]
})
export class OrganizationModule {}
