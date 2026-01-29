import { ClientsModule, Transport } from '@nestjs/microservices';
import { Logger, Module } from '@nestjs/common';
import { RateLimiterGuard, RateLimiterModule } from 'nestjs-rate-limiter';

import { APP_GUARD } from '@nestjs/core';
import { CommonConstants } from '@credebl/common/common.constant';
import { GeoLocationController } from './geo-location.controller';
import { GeoLocationService } from './geo-location.service';
import { NATSClient } from '@credebl/common/NATSClient';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.GEO_LOCATION_SERVICE, process.env.NATS_CREDS_FILE)
      }
    ]),
    RateLimiterModule.register({
      points: 50,
      duration: 1,
      keyPrefix: 'rateLimiter',
      errorMessage: 'Rate limit exceeded, please try again later.'
    })
  ],
  controllers: [GeoLocationController],
  providers: [
    GeoLocationService,
    Logger,
    {
      provide: APP_GUARD,
      useClass: RateLimiterGuard
    },
    NATSClient
  ]
})
export class GeoLocationModule {}
