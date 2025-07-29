/* eslint-disable array-bracket-spacing */
import { Logger, Module, Provider } from '@nestjs/common';
import { ConnectionController } from './connection.controller';
import { ConnectionService } from './connection.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule } from '@credebl/common';
import { ConnectionRepository } from './connection.repository';
import { PrismaService } from '@credebl/prisma-service';
import { CacheModule } from '@nestjs/cache-manager';
import { getNatsOptions } from '@credebl/common';
import { UserActivityRepository } from '@credebl/user-management';
import { CommonConstants } from '@credebl/common';
// import { nkeyAuthenticator } from 'nats';
import { GlobalConfigModule } from '@credebl/logger';
import { ConfigModule as PlatformConfig } from '@credebl/logger';
import { LoggerModule } from '@credebl/logger';
import { ContextInterceptorModule } from '@credebl/common';
import { NATSClient } from '@credebl/common';
import { DynamicModule } from '@nestjs/common';

// @Module({
//   imports: [
//     ClientsModule.register([
//       {
//         name: 'NATS_CLIENT',
//         transport: Transport.NATS,
//         options: getNatsOptions(CommonConstants.CONNECTION_SERVICE, process.env.CONNECTION_NKEY_SEED)
//       }
//     ]),

//      CommonModule,
//      GlobalConfigModule,
//      LoggerModule, PlatformConfig, ContextInterceptorModule,
//      CacheModule.register()
//   ],
//   controllers: [ConnectionController],
//   providers: [ConnectionService, ConnectionRepository, UserActivityRepository, PrismaService, Logger, NATSClient]
// })

@Module({})
export class ConnectionModule {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static register(overrides: Provider[] = [], controllers: any[] = [], imports: any[] = []): DynamicModule {
    return {
      module: ConnectionModule,
      imports: [
        ClientsModule.register([
          {
            name: 'NATS_CLIENT',
            transport: Transport.NATS,
            options: getNatsOptions(CommonConstants.CONNECTION_SERVICE, process.env.CONNECTION_NKEY_SEED)
          }
        ]),
        CommonModule,
        GlobalConfigModule,
        LoggerModule,
        PlatformConfig,
        ContextInterceptorModule,
        CacheModule.register(),
        ...imports
      ],
      controllers: controllers.length ? controllers : [ConnectionController],
      providers: [
        ConnectionService,
        ConnectionRepository,
        UserActivityRepository,
        PrismaService,
        Logger,
        NATSClient,
        ...overrides
      ],
      exports: [ConnectionService]
    };
  }
}
