import { Logger, Module } from '@nestjs/common';
import { PrismaService } from './prisma-service.service';
import { CommonModule } from '@credebl/common';
import { EmailService } from '@credebl/common/email.service';

@Module({
  imports: [CommonModule],
  providers: [PrismaService, Logger, EmailService],
  exports: [PrismaService]
})
export class PrismaServiceModule {}
