import { ClientsModule, Transport } from '@nestjs/microservices';
import { Logger, Module } from '@nestjs/common';

import { ClientRegistrationService } from '@credebl/client-registration';
import { CommonModule } from '@credebl/common';
import { FidoController } from './fido.controller';
import { FidoService } from './fido.service';
import { FidoUserRepository } from '../../repositories/fido-user.repository';
import { HttpModule } from '@nestjs/axios';
import { KeycloakUrlService } from '@credebl/keycloak-url';
import { OrgRolesRepository } from 'libs/org-roles/repositories';
import { OrgRolesService } from '@credebl/org-roles';
import { PrismaService } from '@credebl/prisma-service';
import { SupabaseService } from '@credebl/supabase';
import { UserActivityRepository } from 'libs/user-activity/repositories';
import { UserActivityService } from '@credebl/user-activity';
import { UserDevicesRepository } from '../../repositories/user-device.repository';
import { UserOrgRolesRepository } from 'libs/user-org-roles/repositories';
import { UserOrgRolesService } from '@credebl/user-org-roles';
import { UserRepository } from '../../repositories/user.repository';
import { UserService } from '../user.service';
import { AwsService } from '@credebl/aws';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: {
          servers: [`${process.env.NATS_URL}`]
        }
      }
    ]),
    HttpModule,
    CommonModule
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
    UserActivityRepository
]
})
export class FidoModule { }
