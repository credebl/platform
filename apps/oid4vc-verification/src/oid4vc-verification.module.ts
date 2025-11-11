import { Logger, Module } from '@nestjs/common';
import { Oid4vpVerificationController } from './oid4vc-verification.controller';
import { Oid4vpVerificationService } from './oid4vc-verification.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { getNatsOptions } from '@credebl/common/nats.config';
import { CommonModule } from '@credebl/common';
import { CommonConstants, MICRO_SERVICE_NAME } from '@credebl/common/common.constant';
import { GlobalConfigModule } from '@credebl/config';
import { ContextInterceptorModule } from '@credebl/context';
import { LoggerModule } from '@credebl/logger/logger.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module';
import { NATSClient } from '@credebl/common/NATSClient';
import { PrismaService, PrismaServiceModule } from '@credebl/prisma-service';
import { Oid4vpRepository } from './oid4vc-verification.repository';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ContextInterceptorModule,
    PlatformConfig,
    LoggerModule,
    CacheModule.register(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(
          CommonConstants.OIDC4VC_VERIFICATION_SERVICE,
          process.env.OIDC4VC_VERIFICATION_NKEY_SEED
        )
      }
    ]),
    CommonModule,
    GlobalConfigModule,
    PrismaServiceModule
  ],
  controllers: [Oid4vpVerificationController],
  providers: [
    Oid4vpVerificationService,
    Oid4vpRepository,
    PrismaService,
    Logger,
    NATSClient,
    {
      provide: MICRO_SERVICE_NAME,
      useValue: 'Oid4vc-verification-service'
    }
  ]
})
export class Oid4vpModule {}
