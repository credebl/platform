import { ClientsModule, Transport } from '@nestjs/microservices';

import { AwsService } from '@credebl/aws';
import { CommonConstants } from '@credebl/common/common.constant';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { NATSClient } from '@credebl/common/NATSClient';
import { X509Controller } from './x509.controller';
import { X509Service } from './x509.service';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.X509_SERVICE, process.env.NATS_CREDS_FILE)
      }
    ])
  ],
  controllers: [X509Controller],
  providers: [X509Service, AwsService, NATSClient]
})
export class X509Module {}
