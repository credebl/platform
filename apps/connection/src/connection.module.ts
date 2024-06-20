/* eslint-disable array-bracket-spacing */
import { Logger, Module } from '@nestjs/common';
import { ConnectionController } from './connection.controller';
import { ConnectionService } from './connection.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule } from '@credebl/common';
import { ConnectionRepository } from './connection.repository';
import { PrismaService } from '@credebl/prisma-service';
import { CacheModule } from '@nestjs/cache-manager';
import { getNatsOptions } from '@credebl/common/nats.config';
import { UserActivityRepository } from 'libs/user-activity/repositories';
import { CommonConstants } from '@credebl/common/common.constant';
// import { nkeyAuthenticator } from 'nats';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(process.env.CONNECTION_NKEY_SEED, CommonConstants.CONNECTION_SERVICE)
      }
    ]),

     CommonModule,
     CacheModule.register()
  ],
  controllers: [ConnectionController],
  providers: [ConnectionService, ConnectionRepository, UserActivityRepository, PrismaService, Logger]
})
export class ConnectionModule { }
