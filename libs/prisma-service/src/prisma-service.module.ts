import { Module } from '@nestjs/common';
import { PrismaService } from './prisma-service.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService]
})
export class PrismaServiceModule {}
