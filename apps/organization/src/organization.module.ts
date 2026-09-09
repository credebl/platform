import { ClientsModule, Transport } from '@nestjs/microservices';
import { Logger, Module } from '@nestjs/common';

import { CommonModule } from '@credebl/common';
import { OrgRolesRepository } from 'libs/org-roles/repositories';
import { OrgRolesService } from '@credebl/org-roles';
import { OrganizationController } from './organization.controller';
import { OrganizationRepository } from '../repositories/organization.repository';
import { OrganizationService } from './organization.service';
import { WebhookController } from './webhook.controller';
import { WebhookRepository } from '../repositories/webhook.repository';
import { WebhookService } from './webhook.service';
import { X509CertificateController } from './x509.controller';
import { X509CertificateRepository } from '../repositories/x509.repository';
import { X509CertificateService } from './x509.service';
import { PrismaService } from '@credebl/prisma-service';
import { UserActivityRepository } from 'libs/user-activity/repositories';
import { UserActivityService } from '@credebl/user-activity';
import { UserOrgRolesRepository } from 'libs/user-org-roles/repositories';
import { UserOrgRolesService } from '@credebl/user-org-roles';
import { UserRepository } from 'apps/user/repositories/user.repository';
import { CacheModule } from '@nestjs/cache-manager';
import { getNatsOptions } from '@credebl/common/nats.config';
import { ClientRegistrationService } from '@credebl/client-registration';
import { KeycloakUrlService } from '@credebl/keycloak-url';

import { StorageService } from '@credebl/storage';
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
  controllers: [OrganizationController, WebhookController, X509CertificateController],
  providers: [
    OrganizationService,
    OrganizationRepository,
    WebhookService,
    WebhookRepository,
    X509CertificateService,
    X509CertificateRepository,
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
    StorageService,
    NATSClient
  ],
  exports: [OrganizationRepository]
})
export class OrganizationModule {}
