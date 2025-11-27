import { PrismaServiceModule } from '@credebl/prisma-service';
import { Logger } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { OrgRolesRepository } from '../repositories';
import { OrgRolesService } from './org-roles.service';

@Module({
  imports: [PrismaServiceModule],
  providers: [OrgRolesService, OrgRolesRepository, Logger],
  exports: [OrgRolesService]
})
export class OrgRolesModule {}
