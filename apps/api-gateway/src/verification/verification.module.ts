import { ClientsModule, Transport } from '@nestjs/microservices';

import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions()
      }
    ])
  ],
  controllers: [VerificationController],
  providers: [VerificationService]
})
export class VerificationModule { }
