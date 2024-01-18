import { Logger, Module } from '@nestjs/common';
import { ShorteningUrlController } from './shortening-url.controller';
import { ShorteningUrlService } from './shortening-url.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { getNatsOptions } from '@credebl/common/nats.config';
import { CommonModule } from '@credebl/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ShorteningUrlRepository } from './shortening-url.repository';
import { PrismaService } from '@credebl/prisma-service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(process.env.SHORTENING_URL_NKEY_SEED)
      }
    ]),
    CommonModule,
    CacheModule.register()
  ],
  controllers: [ShorteningUrlController],
  providers: [ShorteningUrlService, Logger, PrismaService, ShorteningUrlRepository]
})
export class ShorteningUrlModule { }
