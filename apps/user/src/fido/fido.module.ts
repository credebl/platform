import { CommonModule } from '@credebl/common';
import { HttpModule } from '@nestjs/axios';
import { Module, Logger } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UserDevicesRepository } from '../../repositories/user-device.repository';
import { UserRepository } from '../../repositories/user.repository';
import { FidoController } from './fido.controller';
import { FidoService } from './fido.service';
import { PrismaService } from '@credebl/prisma-service';
import { UserService } from '../user.service';
import { ClientRegistrationService } from '@credebl/client-registration';
import { KeycloakUrlService } from '@credebl/keycloak-url';
import { FidoUserRepository } from '../../repositories/fido-user.repository';
import { OrgRolesService } from '@credebl/org-roles';
import { UserOrgRolesService } from '@credebl/user-org-roles';
import { OrgRolesRepository } from 'libs/org-roles/repositories';
import { UserOrgRolesRepository } from 'libs/user-org-roles/repositories';


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
    UserService,
    PrismaService,
    FidoService,
    UserRepository,
    UserDevicesRepository,
    ClientRegistrationService,
    Logger,
    KeycloakUrlService,
    FidoUserRepository,
    OrgRolesService,
    UserOrgRolesService,
    OrgRolesRepository,
    UserOrgRolesRepository
]
})
export class FidoModule { }
