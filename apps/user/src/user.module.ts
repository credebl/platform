import { Logger, Module } from '@nestjs/common';
import { OrgRolesModule, OrgRolesService } from '@credebl/org-roles';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule } from '@credebl/common';
import { OrgRolesRepository } from 'libs/org-roles/repositories';
import { PrismaService } from '@credebl/prisma-service';
import { UserController } from './user.controller';
import { UserOrgRolesRepository } from 'libs/user-org-roles/repositories';
import { UserOrgRolesService } from '@credebl/user-org-roles';
import { UserRepository } from '../repositories/user.repository';
import { UserService } from './user.service';
import { ClientRegistrationService } from '@credebl/client-registration';
import { KeycloakUrlService } from '@credebl/keycloak-url';
import { FidoModule } from './fido/fido.module';


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
    CommonModule,
    FidoModule,
    OrgRolesModule
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    PrismaService,
    Logger,
    ClientRegistrationService,
    KeycloakUrlService,
    OrgRolesService,
    UserOrgRolesService,
    OrgRolesRepository,
    UserOrgRolesRepository
  ]
})
export class UserModule {}
