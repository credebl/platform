import { Logger, Module } from '@nestjs/common';
import { CommonModule } from '@credebl/common';
import { PrismaService } from '@credebl/prisma-service';
import { StorageService } from '@credebl/storage';
import { UtilityService } from './utility.service';
import { UtilityRepository } from './utility.repository';

@Module({
  imports: [CommonModule],
  providers: [UtilityService, UtilityRepository, PrismaService, StorageService, Logger],
  exports: [UtilityService]
})
export class UtilityModule {}
