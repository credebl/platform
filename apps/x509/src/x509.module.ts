import { Logger, Module } from '@nestjs/common';
import { X509CertificateService } from './x509.service';
import { PrismaService } from '@credebl/prisma-service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { X509CertificateRepository } from './repositories/x509.repository';
import { getNatsOptions } from '@credebl/common/nats.config';
import { CommonConstants } from '@credebl/common/common.constant';
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module';
import { GlobalConfigModule } from '@credebl/config/global-config.module';
import { LoggerModule } from '@credebl/logger/logger.module';
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule';
import { X509CertificateController } from './x509.controller';

@Module({
  imports: [
    GlobalConfigModule,
    LoggerModule,
    PlatformConfig,
    ContextInterceptorModule,
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.X509_SERVICE, process.env.X509_NKEY_SEED)
      }
    ])
  ],
  controllers: [X509CertificateController],
  providers: [X509CertificateService, PrismaService, X509CertificateRepository, Logger]
})
export class X509Module {}
