import { ClientsModule, Transport } from '@nestjs/microservices';
import { Logger, Module } from '@nestjs/common';

import { CacheModule } from '@nestjs/cache-manager';
import { ClientRegistrationModule } from '@credebl/client-registration';
import { CommonConstants } from '@credebl/common/common.constant';
import { CommonModule } from '@credebl/common';
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule';
import { EcosystemController } from './ecosystem.controller';
import { EcosystemRepository } from '../repositories/ecosystem.repository';
import { EcosystemService } from './ecosystem.service';
import { GlobalConfigModule } from '@credebl/config';
import { LoggerModule } from '@credebl/logger/logger.module';
import { NATSClient } from '@credebl/common/NATSClient';
import { OrganizationRepository } from 'apps/organization/repositories/organization.repository';
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module';
import { PrismaService } from '@credebl/prisma-service';
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
        options: getNatsOptions(CommonConstants.ECOSYSTEM_SERVICE, process.env.ECOSYSTEM_NKEY_SEED)
      }
    ]),
    CommonModule,
    GlobalConfigModule,
    LoggerModule,
    PlatformConfig,
    ContextInterceptorModule,
    CacheModule.register(),
    ClientRegistrationModule
  ],
  controllers: [EcosystemController],
  providers: [
    EcosystemService,
    EcosystemRepository,
    PrismaService,
    Logger,
    NATSClient,
    UserRepository,
    OrganizationRepository,
    UserOrgRolesService,
    UserOrgRolesRepository
  ],
  exports: [EcosystemService, EcosystemRepository]
})
export class EcosystemModule {}
