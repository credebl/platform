import { CommonModule } from '@credebl/common';
import { Module, Logger } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OrganizationController } from './organization.controller';
import { OrganizationRepository } from '../repositories/organization.repository';
import { OrganizationService } from './organization.service';
import { PrismaService } from '@credebl/prisma-service';
import { OrgRolesService } from '@credebl/org-roles';
import { UserOrgRolesService } from '@credebl/user-org-roles';
import { OrgRolesRepository } from 'libs/org-roles/repositories';
import { UserOrgRolesRepository } from 'libs/user-org-roles/repositories';
import { UserRepository } from 'apps/user/repositories/user.repository';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: {
          servers: [`${process.env.NATS_URL}`]
        }
      }
    ]),
    CommonModule
  ],
  controllers: [OrganizationController],
  providers: [OrganizationService, OrganizationRepository, PrismaService, Logger, OrgRolesService, UserOrgRolesService, OrgRolesRepository, UserOrgRolesRepository, UserRepository]

})
export class OrganizationModule {}
