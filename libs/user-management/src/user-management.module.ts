import { Module } from '@nestjs/common';
import { OrgRolesRepository, UserActivityRepository, UserOrgRolesRepository } from './repositories';
import { PrismaServiceModule } from '@credebl/prisma-service';
import {
  ClientRegistrationService,
  KeycloakUrlService,
  OrgRolesService,
  SupabaseService,
  UserActivityService
} from './services';

@Module({
  imports: [PrismaServiceModule],
  providers: [
    OrgRolesService,
    OrgRolesRepository,
    UserActivityService,
    SupabaseService,
    KeycloakUrlService,
    ClientRegistrationService,
    UserOrgRolesRepository,
    UserActivityRepository
  ],
  exports: [
    OrgRolesService,
    OrgRolesRepository,
    UserActivityService,
    SupabaseService,
    KeycloakUrlService,
    ClientRegistrationService,
    UserOrgRolesRepository,
    UserActivityRepository
  ]
})
export class UserManagementModule {}
