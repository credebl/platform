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
    CacheModule.register()
  ],
  controllers: [GeoLocationController],
  providers: [GeoLocationService, Logger, PrismaService, GeoLocationRepository]
})
export class GeoLocationModule {}
