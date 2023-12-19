import { ClientsModule, Transport } from '@nestjs/microservices';
import { Logger, Module } from '@nestjs/common';

import { CommonModule } from '@credebl/common';
import { OrgRolesRepository } from 'libs/org-roles/repositories';
import { OrgRolesService } from '@credebl/org-roles';
import { OrganizationController } from './organization.controller';
import { OrganizationRepository } from '../repositories/organization.repository';
import { OrganizationService } from './organization.service';
import { PrismaService } from '@credebl/prisma-service';
import { UserActivityRepository } from 'libs/user-activity/repositories';
import { UserActivityService } from '@credebl/user-activity';
import { UserOrgRolesRepository } from 'libs/user-org-roles/repositories';
import { UserOrgRolesService } from '@credebl/user-org-roles';
import { UserRepository } from 'apps/user/repositories/user.repository';
import { CacheModule } from '@nestjs/cache-manager';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(process.env.ORGANIZATION_NKEY_SEED)
      }
    ]),
    CommonModule,
    CacheModule.register()
  ],
  controllers: [OrganizationController],
  providers: [
    OrganizationService, OrganizationRepository, PrismaService,
     Logger, OrgRolesService, UserOrgRolesService, OrgRolesRepository, UserActivityRepository,
      UserOrgRolesRepository, UserRepository, UserActivityService
    ]

})
export class OrganizationModule {}
