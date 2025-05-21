import { NATSClient } from '@credebl/common/NATSClient'
import { CommonConstants } from '@credebl/common/common.constant'
import { getNatsOptions } from '@credebl/common/nats.config'
import { Logger, Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { RateLimiterGuard, RateLimiterModule } from 'nestjs-rate-limiter'
import { GeoLocationController } from './geo-location.controller'
import { GeoLocationService } from './geo-location.service'

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.GEO_LOCATION_SERVICE, process.env.API_GATEWAY_NKEY_SEED),
      },
    ]),
    RateLimiterModule.register({
      points: 50,
      duration: 1,
      keyPrefix: 'rateLimiter',
      errorMessage: 'Rate limit exceeded, please try again later.',
    }),
  ],
  controllers: [GeoLocationController],
  providers: [
    GeoLocationService,
    Logger,
    {
      provide: APP_GUARD,
      useClass: RateLimiterGuard,
    },
    NATSClient,
  ],
})
export class GeoLocationModule {}
