import { Logger, Module } from '@nestjs/common';
import { EcosystemController } from './ecosystem.controller';
import { EcosystemService } from './ecosystem.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule} from '@credebl/common';
import { EcosystemRepository } from './ecosystem.repository';
import { PrismaService } from '@credebl/prisma-service';
import { CacheModule } from '@nestjs/cache-manager';
import { getNatsOptions } from '@credebl/common/nats.config';
import { UserActivityRepository } from 'libs/user-activity/repositories';
import { CommonConstants } from '@credebl/common/common.constant';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(process.env.ECOSYSTEM_NKEY_SEED, CommonConstants.ECOSYSTEM_SERVICE)
      }
    ]),

    CommonModule,
    CacheModule.register()
  ],
  controllers: [EcosystemController],
  providers: [EcosystemService, UserActivityRepository, PrismaService, Logger, EcosystemRepository]
})
export class EcosystemModule { }