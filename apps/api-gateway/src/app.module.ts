import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonConstants, MICRO_SERVICE_NAME } from '@credebl/common/common.constant';
import { ConditionalModule, ConfigModule } from '@nestjs/config';
import { DynamicModule, MiddlewareConsumer, Module, Provider, RequestMethod } from '@nestjs/common';

import { AgentController } from './agent/agent.controller';
import { AgentServiceModule } from './agent-service/agent-service.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthzMiddleware } from './authz/authz.middleware';
import { AuthzModule } from './authz/authz.module';
import { CacheModule } from '@nestjs/cache-manager';
import { CloudWalletModule } from './cloud-wallet/cloud-wallet.module';
import { ConnectionModule } from './connection/connection.module';
import { ContextModule } from '@credebl/common/utils/context/contextModule';
import { CredentialDefinitionModule } from './credential-definition/credential-definition.module';
import { EcosystemModule } from './ecosystem/ecosystem.module';
import { EcosystemFeatureGuard } from './authz/guards/ecosystem-feature-guard';
import { EcosystemSwaggerFilter } from './authz/guards/ecosystem-swagger.filter';
import { FidoModule } from './fido/fido.module';
import { GeoLocationModule } from './geo-location/geo-location.module';
import { GlobalConfigModule } from '@credebl/common/global-config.module';
import { KeycloakConfigModule } from '@credebl/keycloak';
import { IssuanceModule } from './issuance/issuance.module';
import { LoggerModule } from '@credebl/logger/logger.module';
import { NotificationModule } from './notification/notification.module';
import { Oid4vcIssuanceModule } from './oid4vc-issuance/oid4vc-issuance.module';
import { Oid4vpModule } from './oid4vc-verification/oid4vc-verification.module';
import { OrganizationModule } from './organization/organization.module';
import { ConfigModule as PlatformConfig } from '@credebl/config';
import { PlatformModule } from './platform/platform.module';
import { RevocationController } from './revocation/revocation.controller';
import { RevocationModule } from './revocation/revocation.module';
import { SchemaModule } from './schema/schema.module';
import { UserModule } from './user/user.module';
import { UtilitiesModule } from './utilities/utilities.module';
import { VerificationModule } from './verification/verification.module';
import { WebhookModule } from './webhook/webhook.module';
import { X509Module } from './x509/x509.module';
import { getNatsOptions } from '@credebl/common/nats.config';
import { shouldLoadOidcModules } from '@credebl/common/common.utils';

@Module({})
export class APIGatewayModule {
  static register(
    overrides: Provider[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controllerOverrides: any[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    importedModules: any[] = []
  ): DynamicModule {
    return {
      module: APIGatewayModule,
      imports: [
        ConfigModule.forRoot(),
        ContextModule,
        PlatformConfig,
        LoggerModule,
        ClientsModule.register([
          {
            name: 'NATS_CLIENT',
            transport: Transport.NATS,
            options: getNatsOptions(
              CommonConstants.API_GATEWAY_SERVICE,
              process.env.API_GATEWAY_NKEY_SEED,
              process.env.NATS_CREDS_FILE
            )
          }
        ]),
        AgentServiceModule.register(),
        PlatformModule.register(),
        AuthzModule.register(),
        CredentialDefinitionModule.register(),
        SchemaModule.register(),
        RevocationModule.register(),
        VerificationModule.register(),
        FidoModule.register(),
        OrganizationModule.register(),
        UserModule.register(),
        ConnectionModule.register(),
        IssuanceModule.register(),
        UtilitiesModule.register(),
        WebhookModule.register(),
        NotificationModule.register(),
        EcosystemModule.register(),
        GlobalConfigModule,
        CacheModule.register(),
        GeoLocationModule.register(),
        CloudWalletModule.register(),
        ConditionalModule.registerWhen(Oid4vcIssuanceModule.register(), shouldLoadOidcModules),
        ConditionalModule.registerWhen(Oid4vpModule.register(), shouldLoadOidcModules),
        ConditionalModule.registerWhen(X509Module.register(), shouldLoadOidcModules),
        KeycloakConfigModule,
        ...importedModules
      ],
      controllers: controllerOverrides.length ? controllerOverrides : [AppController],
      providers: [
        AppService,
        EcosystemFeatureGuard,
        EcosystemSwaggerFilter,
        {
          provide: MICRO_SERVICE_NAME,
          useValue: 'APIGATEWAY'
        },
        ...overrides
      ],
      exports: [CacheModule]
    };
  }

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

// Keep backward-compatible alias
export { APIGatewayModule as AppModule };
