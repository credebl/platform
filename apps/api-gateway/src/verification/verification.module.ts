import { ClientsModule } from '@nestjs/microservices';

import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { commonNatsOptions } from 'libs/service/nats.options';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        ...commonNatsOptions('VERIFICATION_SERVICE:REQUESTER')
      }
    ])

  ],
  controllers: [VerificationController],
  providers: [VerificationService]
})
export class VerificationModule { }
