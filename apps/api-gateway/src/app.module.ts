import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AgentController } from './agent/agent.controller';
import { AgentModule } from './agent-service/agent-service.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthzMiddleware } from './authz/authz.middleware';
import { AuthzModule } from './authz/authz.module';
import { ClientsModule } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { CredentialDefinitionModule } from './credential-definition/credential-definition.module';
import { FidoModule } from './fido/fido.module';
import { IssuanceModule } from './issuance/issuance.module';
import { OrganizationModule } from './organization/organization.module';
import { PlatformModule } from './platform/platform.module';
import { VerificationModule } from './verification/verification.module';
import { RevocationController } from './revocation/revocation.controller';
import { RevocationModule } from './revocation/revocation.module';
import { SchemaModule } from './schema/schema.module';
import { commonNatsOptions } from 'libs/service/nats.options';
import { UserModule } from './user/user.module';
import { ConnectionModule } from './connection/connection.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        ...commonNatsOptions('AGENT_SERVICE:REQUESTER')
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
    IssuanceModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {
  configure(userContext: MiddlewareConsumer): void {
    userContext.apply(AuthzMiddleware)
      .exclude({ path: 'authz', method: RequestMethod.ALL },
        'authz/:splat*',
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
      .forRoutes(
        AgentController,
        RevocationController
      );
  }
}
