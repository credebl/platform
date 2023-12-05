import { CommonModule } from '@credebl/common';
import { PrismaService } from '@credebl/prisma-service';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { IssuanceController } from './issuance.controller';
import { IssuanceRepository } from './issuance.repository';
import { IssuanceService } from './issuance.service';
import { getNatsOptions } from '@credebl/common/nats.config';
import { OutOfBandIssuance } from '../templates/out-of-band-issuance.template';
import { EmailDto } from '@credebl/common/dtos/email.dto';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { BulkIssuanceProcessor } from './issuance.processor';
import { AwsService } from '@credebl/aws';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(process.env.ISSUANCE_NKEY_SEED)
      }
    ]),
    CommonModule,
    CacheModule.register({ store: redisStore, host: process.env.REDIS_HOST, port: process.env.REDIS_PORT }),
    BullModule.registerQueue({
      name: 'bulk-issuance'
    })
  ],
  controllers: [IssuanceController],
  providers: [IssuanceService, IssuanceRepository, PrismaService, Logger, OutOfBandIssuance, EmailDto, BulkIssuanceProcessor, AwsService]
})
export class IssuanceModule { }
