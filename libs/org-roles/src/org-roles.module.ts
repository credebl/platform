import { PrismaService } from '@credebl/prisma-service';
import { Logger } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { OrgRolesRepository } from '../repositories';
import { OrgRolesService } from './org-roles.service';

@Module({
  providers: [OrgRolesService, OrgRolesRepository, Logger, PrismaService],
  exports: [OrgRolesService]
})
export class OrgRolesModule {}
