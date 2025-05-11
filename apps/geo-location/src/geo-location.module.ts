import { Logger, Module } from '@nestjs/common';
import { GeoLocationController } from './geo-location.controller';
import { GeoLocationService } from './geo-location.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule } from '@credebl/common';
import { CacheModule } from '@nestjs/cache-manager';
import { getNatsOptions } from '@credebl/common/nats.config';
import { PrismaService } from '@credebl/prisma-service';
import { GeoLocationRepository } from './geo-location.repository';
import { CommonConstants } from '@credebl/common/common.constant';
import { GlobalConfigModule } from '@credebl/config/global-config.module';
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module';
import { LoggerModule } from '@credebl/logger/logger.module';
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.GEO_LOCATION_SERVICE, process.env.GEOLOCATION_NKEY_SEED)
      }
    ]),
    CommonModule,
    GlobalConfigModule,
    LoggerModule, PlatformConfig, ContextInterceptorModule,
    CacheModule.register()
  ],
  controllers: [GeoLocationController],
  providers: [GeoLocationService, Logger, PrismaService, GeoLocationRepository]
})
export class GeoLocationModule {}
