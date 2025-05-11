import { PrismaService } from '@credebl/prisma-service';
import { Logger } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { UserOrgRolesRepository } from '../repositories';
import { UserOrgRolesService } from './user-org-roles.service';

@Module({
  providers: [UserOrgRolesService, UserOrgRolesRepository, Logger, PrismaService],
  exports: [UserOrgRolesService]
})
export class UserOrgRolesModule {}
