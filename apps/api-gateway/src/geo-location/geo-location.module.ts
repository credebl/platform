import { Logger, Module } from '@nestjs/common';
import { GeoLocationController } from './geo-location.controller';
import { GeoLocationService } from './geo-location.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { getNatsOptions } from '@credebl/common/nats.config';
import { CommonModule } from '@credebl/common';
import { RateLimiterModule, RateLimiterGuard } from 'nestjs-rate-limiter';
import { APP_GUARD } from '@nestjs/core';
import { CommonConstants } from '@credebl/common/common.constant';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.GEO_LOCATION_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
      },
      CommonModule
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
    }
  ]
})
export class GeoLocationModule {}