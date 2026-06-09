import { PrismaServiceModule } from '@credebl/prisma-service';
import { Logger, Module } from '@nestjs/common';
import { OrgRolesRepository } from './repositories';
import { OrgRolesService } from './services/org-roles.service';

@Module({
  imports: [PrismaServiceModule],
  providers: [OrgRolesService, OrgRolesRepository, Logger],
  exports: [OrgRolesService]
})
export class OrgRolesModule {}
