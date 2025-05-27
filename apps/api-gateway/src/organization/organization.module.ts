import { CommonModule, CommonService } from '@credebl/common'

import { AwsService } from '@credebl/aws'
import { NATSClient } from '@credebl/common/NATSClient'
import { CommonConstants } from '@credebl/common/common.constant'
import { getNatsOptions } from '@credebl/common/nats.config'
import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { OrganizationController } from './organization.controller'
import { OrganizationService } from './organization.service'
@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.ORGANIZATION_SERVICE, process.env.API_GATEWAY_NKEY_SEED),
      },
      CommonModule,
    ]),
  ],
  controllers: [OrganizationController],
  providers: [OrganizationService, CommonService, AwsService, NATSClient],
})
export class OrganizationModule {}
