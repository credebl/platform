import { ClientsModule, Transport } from '@nestjs/microservices';
/* eslint-disable array-bracket-spacing */
import { Logger, Module } from '@nestjs/common';

import { CacheModule } from '@nestjs/cache-manager';
import { CommonConstants } from '@credebl/common/common.constant';
import { CommonModule } from '@credebl/common';
import { ConnectionController } from './connection.controller';
import { ConnectionRepository } from './connection.repository';
import { ConnectionService } from './connection.service';
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule';
// import { nkeyAuthenticator } from 'nats';
import { GlobalConfigModule } from '@credebl/config/global-config.module';
import { LoggerModule } from '@credebl/logger/logger.module';
import { NATSClient } from '@credebl/common/NATSClient';
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module';
import { PrismaService } from '@credebl/prisma-service';
import { UserActivityRepository } from 'libs/user-activity/repositories';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.CONNECTION_SERVICE, process.env.NATS_CREDS_FILE)
      }
    ]),

    CommonModule,
    GlobalConfigModule,
    LoggerModule,
    PlatformConfig,
    ContextInterceptorModule,
    CacheModule.register()
  ],
  controllers: [ConnectionController],
  providers: [ConnectionService, ConnectionRepository, UserActivityRepository, PrismaService, Logger, NATSClient]
})
export class ConnectionModule {}
