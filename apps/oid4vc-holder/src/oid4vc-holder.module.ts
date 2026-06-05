import { Module, Logger } from '@nestjs/common';
import { Oid4vcHolderController } from './oid4vc-holder.controller';
import { Oid4vcHolderService } from './oid4vc-holder.service';
import { CommonModule } from '@credebl/common';
import { CommonConstants } from '@credebl/common/common.constant';
import { LoggerModule } from '@credebl/logger';
import { PrismaServiceModule } from '@credebl/prisma-service';
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module';
import { GlobalConfigModule } from '@credebl/config';
import { ContextInterceptorModule } from '@credebl/context';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { getNatsOptions } from '@credebl/common/nats.config';
import { NATSClient } from '@credebl/common/NATSClient';

@Module({
  imports: [
    CommonModule,
    LoggerModule,
    PrismaServiceModule,
    PlatformConfig,
    GlobalConfigModule,
    ContextInterceptorModule,
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(
          CommonConstants.OIDC4VC_HOLDER_SERVICE,
          process.env.OIDC4VC_HOLDER_NKEY_SEED,
          process.env.NATS_CREDS_FILE
        )
      }
    ])
  ],
  controllers: [Oid4vcHolderController],
  providers: [Oid4vcHolderService, NATSClient, Logger]
})
export class Oid4vcHolderModule {}
