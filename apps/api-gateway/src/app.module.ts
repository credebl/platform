import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AgentController } from './agent/agent.controller';
import { AgentModule } from './agent-service/agent-service.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthzMiddleware } from './authz/authz.middleware';
import { AuthzModule } from './authz/authz.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConditionalModule, ConfigModule } from '@nestjs/config';
import { CredentialDefinitionModule } from './credential-definition/credential-definition.module';
import { FidoModule } from './fido/fido.module';
import { IssuanceModule } from './issuance/issuance.module';
import { OrganizationModule } from './organization/organization.module';
import { PlatformModule } from './platform/platform.module';
import { VerificationModule } from './verification/verification.module';
import { RevocationController } from './revocation/revocation.controller';
import { RevocationModule } from './revocation/revocation.module';
import { SchemaModule } from './schema/schema.module';
import { UserModule } from './user/user.module';
import { ConnectionModule } from './connection/connection.module';
import { getNatsOptions } from '@credebl/common/nats.config';
import { CacheModule } from '@nestjs/cache-manager';
import { WebhookModule } from './webhook/webhook.module';
import { UtilitiesModule } from './utilities/utilities.module';
import { NotificationModule } from './notification/notification.module';
import { GeoLocationModule } from './geo-location/geo-location.module';
import { CommonConstants, MICRO_SERVICE_NAME } from '@credebl/common/common.constant';
import { CloudWalletModule } from './cloud-wallet/cloud-wallet.module';
import { ContextModule } from '@credebl/context/contextModule';
import { LoggerModule } from '@credebl/logger/logger.module';
import { GlobalConfigModule } from '@credebl/config/global-config.module';
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module';
import { Oid4vcIssuanceModule } from './oid4vc-issuance/oid4vc-issuance.module';
import { X509Module } from './x509/x509.module';
import { Oid4vpModule } from './oid4vc-verification/oid4vc-verification.module';
import { shouldLoadOidcModules } from '@credebl/common/common.utils';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ContextModule,
    PlatformConfig,
    LoggerModule,
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.API_GATEWAY_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
      }
    ]),
    AgentModule,
    PlatformModule,
    AuthzModule,
    CredentialDefinitionModule,
    SchemaModule,
    RevocationModule,
    VerificationModule,
    FidoModule,
    OrganizationModule,
    UserModule,
    ConnectionModule,
    IssuanceModule,
    UtilitiesModule,
    WebhookModule,
    NotificationModule,
    GlobalConfigModule,
    CacheModule.register(),
    GeoLocationModule,
    CloudWalletModule,
    ConditionalModule.registerWhen(Oid4vcIssuanceModule, shouldLoadOidcModules),
    ConditionalModule.registerWhen(Oid4vpModule, shouldLoadOidcModules),
    ConditionalModule.registerWhen(X509Module, shouldLoadOidcModules)
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: MICRO_SERVICE_NAME,
      useValue: 'APIGATEWAY'
    }
  ],
  exports: [CacheModule]
})
export class AppModule {
  configure(userContext: MiddlewareConsumer): void {
    userContext
      .apply(AuthzMiddleware)
      .exclude(
        // The below excludes authz with all its subpaths
        { path: 'authz/(.*)', method: RequestMethod.ALL },
        'admin/subscriptions',
        'registry/organizations/',
        'email/user/verify',
        'platform/connection',
        'platform/test',
        'category/active-categories',
        'credential-definition/holder/:orgId',
        'admin/organizations',
        'admin/forgot-password',
        'present-proof/holder-remote/credential-record',
        'present-proof/record/verifier-remote/:verifierId',
        'registry/test',
        'admin/check-user-exist/:username',
        'admin/org-name-exists',
        'admin/user-email-exists/:email',
        'registry/organizations/invitations',
        'tenants/:id',
        'tenants',
        'tenants/invitations/:id',
        'admin/user-by-email/:email',
        'registry/update-user-using-invitation',
        'present-proof/generate-proof-request',
        'admin/user-login',
        'registry/organizations',
        'issue-credentials/national-id',
        'labels/:id'
      )
      .forRoutes(AgentController, RevocationController);
  }
}
