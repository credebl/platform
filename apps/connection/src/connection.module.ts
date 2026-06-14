/* eslint-disable array-bracket-spacing */
import { DynamicModule, Logger, Module, Provider } from '@nestjs/common';
import { ConnectionController } from './connection.controller';
import { ConnectionService } from './connection.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule } from '@credebl/common';
import { ConnectionRepository } from './connection.repository';
import { PrismaService } from '@credebl/prisma-service';
import { CacheModule } from '@nestjs/cache-manager';
import { getNatsOptions } from '@credebl/common/nats.config';
import { UserActivityRepository } from '@credebl/user-management';
import { CommonConstants } from '@credebl/common/common.constant';
// import { nkeyAuthenticator } from 'nats';
import { GlobalConfigModule } from '@credebl/common/global-config.module';
import { ConfigModule as PlatformConfig } from '@credebl/config';
import { LoggerModule } from '@credebl/logger/logger.module';
import { ContextInterceptorModule } from '@credebl/common/utils/context/contextInterceptorModule';
import { NATSClient } from '@credebl/common/NATSClient';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(
          CommonConstants.CONNECTION_SERVICE,
          process.env.CONNECTION_NKEY_SEED,
          process.env.NATS_CREDS_FILE
        )
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
export class ConnectionModule {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static register(
    overrides: Provider[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controllerOverrides: any[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    importedModules: any[] = []
  ): DynamicModule {
    return {
      module: ConnectionModule,
      imports: [
        ClientsModule.register([
          {
            name: 'NATS_CLIENT',
            transport: Transport.NATS,
            options: getNatsOptions(
              CommonConstants.CONNECTION_SERVICE,
              process.env.CONNECTION_NKEY_SEED,
              process.env.NATS_CREDS_FILE
            )
          }
        ]),
        CommonModule,
        GlobalConfigModule,
        LoggerModule,
        PlatformConfig,
        ContextInterceptorModule,
        CacheModule.register(),
        ...importedModules
      ],
      controllers: controllerOverrides.length ? controllerOverrides : [ConnectionController],
      providers: [
        ConnectionService,
        ConnectionRepository,
        UserActivityRepository,
        PrismaService,
        Logger,
        NATSClient,
        ...overrides
      ],
      exports: [ConnectionService, ConnectionRepository]
    };
  }
}
