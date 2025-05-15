import { Logger, Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'

import { AwsService } from '@credebl/aws'
import { ClientRegistrationService } from '@credebl/client-registration'
import { CommonModule } from '@credebl/common'
import { NATSClient } from '@credebl/common/NATSClient'
import { KeycloakUrlService } from '@credebl/keycloak-url'
import { OrgRolesService } from '@credebl/org-roles'
import { PrismaService } from '@credebl/prisma-service'
import { SupabaseService } from '@credebl/supabase'
import { UserActivityService } from '@credebl/user-activity'
import { UserOrgRolesService } from '@credebl/user-org-roles'
import { HttpModule } from '@nestjs/axios'
import { OrgRolesRepository } from 'libs/org-roles/repositories'
import { UserActivityRepository } from 'libs/user-activity/repositories'
import { UserOrgRolesRepository } from 'libs/user-org-roles/repositories'
import { FidoUserRepository } from '../../repositories/fido-user.repository'
import { UserDevicesRepository } from '../../repositories/user-device.repository'
import { UserRepository } from '../../repositories/user.repository'
import { UserService } from '../user.service'
import { FidoController } from './fido.controller'
import { FidoService } from './fido.service'

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: {
          servers: [`${process.env.NATS_URL}`],
        },
      },
    ]),
    HttpModule,
    CommonModule,
  ],
  controllers: [FidoController],
  providers: [
    AwsService,
    UserService,
    PrismaService,
    FidoService,
    UserRepository,
    UserDevicesRepository,
    ClientRegistrationService,
    SupabaseService,
    Logger,
    KeycloakUrlService,
    FidoUserRepository,
    OrgRolesService,
    UserOrgRolesService,
    OrgRolesRepository,
    UserOrgRolesRepository,
    UserActivityService,
    UserActivityRepository,
    NATSClient,
  ],
})
export class FidoModule {}
