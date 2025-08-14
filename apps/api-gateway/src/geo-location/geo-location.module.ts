import { DynamicModule, Logger, Module, Provider } from '@nestjs/common';
import { GeoLocationController } from './geo-location.controller';
import { GeoLocationService } from './geo-location.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { getNatsOptions } from '@credebl/common';
import { RateLimiterModule, RateLimiterGuard } from 'nestjs-rate-limiter';
import { APP_GUARD } from '@nestjs/core';
import { CommonConstants } from '@credebl/common';
import { NATSClient } from '@credebl/common';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.GEO_LOCATION_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
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
export class GeoLocationModule {
  static register(
    overrides: Provider[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controllerOverrides: any[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    importedModules: any[] = []
  ): DynamicModule {
    return {
      module: GeoLocationModule,
      imports: [
        ClientsModule.register([
          {
            name: 'NATS_CLIENT',
            transport: Transport.NATS,
            options: getNatsOptions(CommonConstants.GEO_LOCATION_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
          }
        ]),
        RateLimiterModule.register({
          points: 50,
          duration: 1,
          keyPrefix: 'rateLimiter',
          errorMessage: 'Rate limit exceeded, please try again later.'
        }),
        ...importedModules
      ],
      controllers: controllerOverrides.length ? controllerOverrides : [GeoLocationController],
      providers: [
        GeoLocationService,
        Logger,
        {
          provide: APP_GUARD,
          useClass: RateLimiterGuard
        },
        NATSClient,
        ...overrides
      ]
    };
  }
}
