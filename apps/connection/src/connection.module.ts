import { CommonModule } from '@credebl/common'
import { NATSClient } from '@credebl/common/NATSClient'
import { CommonConstants } from '@credebl/common/common.constant'
import { getNatsOptions } from '@credebl/common/nats.config'
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module'
// import { nkeyAuthenticator } from 'nats';
import { GlobalConfigModule } from '@credebl/config/global-config.module'
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule'
import { LoggerModule } from '@credebl/logger/logger.module'
import { PrismaService } from '@credebl/prisma-service'
import { CacheModule } from '@nestjs/cache-manager'
/* eslint-disable array-bracket-spacing */
import { Logger, Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { UserActivityRepository } from 'libs/user-activity/repositories'
import { ConnectionController } from './connection.controller'
import { ConnectionRepository } from './connection.repository'
import { ConnectionService } from './connection.service'

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.CONNECTION_SERVICE, process.env.CONNECTION_NKEY_SEED),
      },
    ]),

    CommonModule,
    GlobalConfigModule,
    LoggerModule,
    PlatformConfig,
    ContextInterceptorModule,
    CacheModule.register(),
  ],
  controllers: [ConnectionController],
  providers: [ConnectionService, ConnectionRepository, UserActivityRepository, PrismaService, Logger, NATSClient],
})
export class ConnectionModule {}
