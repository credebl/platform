import { ClientsModule, Transport } from '@nestjs/microservices';
import { Logger, Module } from '@nestjs/common';

import { CommonConstants } from '@credebl/common/common.constant';
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule';
import { GlobalConfigModule } from '@credebl/config/global-config.module';
import { LoggerModule } from '@credebl/logger/logger.module';
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module';
import { PrismaService } from '@credebl/prisma-service';
import { X509CertificateController } from './x509.controller';
import { X509CertificateRepository } from './repositories/x509.repository';
import { X509CertificateService } from './x509.service';
import { getNatsOptions } from '@credebl/common/nats.config';

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
        options: getNatsOptions(CommonConstants.X509_SERVICE, process.env.NATS_CREDS_FILE)
      }
    ])
  ],
  controllers: [X509CertificateController],
  providers: [X509CertificateService, PrismaService, X509CertificateRepository, Logger]
})
export class X509Module {}
