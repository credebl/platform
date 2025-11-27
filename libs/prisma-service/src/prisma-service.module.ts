import { Logger, Module } from '@nestjs/common';
import { PrismaService } from './prisma-service.service';
import { CommonModule } from '@credebl/common';

@Module({
  imports: [CommonModule],
  providers: [PrismaService, Logger],
  exports: [PrismaService]
})
export class PrismaServiceModule {}
