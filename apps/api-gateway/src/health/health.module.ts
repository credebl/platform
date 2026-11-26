import { ClientsModule, Transport } from '@nestjs/microservices';
import { Module } from '@nestjs/common';
import { CommonConstants } from '@credebl/common/common.constant';
import { getNatsOptions } from '@credebl/common/nats.config';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(
          CommonConstants.API_GATEWAY_SERVICE,
          process.env.API_GATEWAY_NKEY_SEED,
          process.env.NATS_CREDS_FILE
        )
      }
    ])
  ],
  controllers: [HealthController],
  providers: [HealthService]
})
export class HealthModule {}
