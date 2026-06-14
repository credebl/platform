import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { PrismaServiceModule } from '@credebl/prisma-service';
import { ConfigService } from './config.service';
import { PlatformConfigRepository } from './platform-config.repository';

@Global()
@Module({
  imports: [NestConfigModule.forRoot({ isGlobal: true }), PrismaServiceModule],
  providers: [ConfigService, PlatformConfigRepository],
  exports: [ConfigService, PlatformConfigRepository]
})
export class ConfigModule {}
