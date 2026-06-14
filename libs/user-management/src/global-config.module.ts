import { Logger, Module } from '@nestjs/common';
import { OrgRolesRepository, UserActivityRepository, UserOrgRolesRepository } from './repositories';
import { PrismaServiceModule } from '@credebl/prisma-service';
import {
  ClientRegistrationService,
  KeycloakUrlService,
  OrgRolesService,
  SupabaseService,
  UserActivityService,
  UserOrgRolesService
} from './services';
import { CommonConstants, GlobalConfigModule, getNatsOptions } from '@credebl/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    PrismaServiceModule,
    GlobalConfigModule,
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.CLOUD_WALLET_SERVICE, process.env.USER_MANAGEMENT_NKEY_SEED)
      }
    ])
  ],
  providers: [
    KeycloakUrlService,
    OrgRolesService,
    OrgRolesRepository,
    UserActivityService,
    SupabaseService,
    ClientRegistrationService,
    UserOrgRolesRepository,
    UserActivityRepository,
    UserOrgRolesService,
    Logger
  ],
  exports: [
    KeycloakUrlService,
    OrgRolesService,
    OrgRolesRepository,
    UserActivityService,
    SupabaseService,
    ClientRegistrationService,
    UserOrgRolesRepository,
    UserActivityRepository,
    UserOrgRolesService
  ]
})
export class UserManagementModule {}

export { UserManagementModule as OrgRolesModule };
