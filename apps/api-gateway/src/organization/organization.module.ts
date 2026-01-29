import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule, CommonService } from '@credebl/common';

import { AwsService } from '@credebl/aws';
import { CommonConstants } from '@credebl/common/common.constant';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { NATSClient } from '@credebl/common/NATSClient';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.ORGANIZATION_SERVICE, process.env.NATS_CREDS_FILE)
      },
      CommonModule
    ])
  ],
  controllers: [OrganizationController],
  providers: [OrganizationService, CommonService, AwsService, NATSClient]
})
export class OrganizationModule {}
