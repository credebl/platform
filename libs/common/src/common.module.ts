import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { CommonService } from './common.service';
import { ContextInterceptorModule, ContextModule, NatsInterceptor, NATSClient } from './utils';
import { PrismaServiceModule } from '@credebl/prisma-service';

@Module({
  imports: [HttpModule, ContextModule, ContextInterceptorModule, PrismaServiceModule],
  providers: [CommonService, NatsInterceptor, NATSClient],
  exports: [CommonService]
})
export class CommonModule {}
