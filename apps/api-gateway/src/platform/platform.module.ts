import { NATSClient } from '@credebl/common/NATSClient'
import { CommonConstants } from '@credebl/common/common.constant'
import { getNatsOptions } from '@credebl/common/nats.config'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { PlatformController } from './platform.controller'
import { PlatformService } from './platform.service'
@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.PLATFORM_SERVICE, process.env.API_GATEWAY_NKEY_SEED),
      },
    ]),
  ],
  controllers: [PlatformController],
  providers: [PlatformService, NATSClient],
})
export class PlatformModule {}
