import { Logger, Module } from '@nestjs/common';
import { PrismaService } from './prisma-service.service';

@Module({
  providers: [PrismaService, Logger],
  exports: [PrismaService]
})
export class PrismaServiceModule {}
