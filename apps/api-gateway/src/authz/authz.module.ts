import { ClientsModule, Transport } from '@nestjs/microservices';
import { DynamicModule, Logger, Module, Provider } from '@nestjs/common';

import { AgentService } from '../agent/agent.service';
import { AuthzController } from './authz.controller';
import { AuthzService } from './authz.service';
import { CommonConstants } from '@credebl/common/common.constant';
import { CommonModule } from '@credebl/common/common.module';
import { CommonService } from '@credebl/common/common.service';
import { ConnectionService } from '../connection/connection.service';
import { EcosystemModule } from '../ecosystem/ecosystem.module';
import { HttpModule } from '@nestjs/axios';
import { JwtStrategy } from './jwt.strategy';
import { MobileJwtStrategy } from './mobile-jwt.strategy';
import { NATSClient } from '@credebl/common/NATSClient';
import { OrganizationService } from '../organization/organization.service';
import { PassportModule } from '@nestjs/passport';
import { PrismaServiceModule } from '@credebl/prisma-service';
import { SocketGateway } from './socket.gateway';
import { SupabaseService } from '@credebl/supabase';
import { UserModule } from '../user/user.module';
import { UserRepository } from 'apps/user/repositories/user.repository';
import { UserService } from '../user/user.service';
import { VerificationService } from '../verification/verification.service';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({})
export class AuthzModule {
  static register(
    overrides: Provider[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controllerOverrides: any[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    importedModules: any[] = []
  ): DynamicModule {
    return {
      module: AuthzModule,
      imports: [
        EcosystemModule,
        HttpModule,
        PassportModule.register({
          defaultStrategy: 'jwt',
          mobileStrategy: 'mobile-jwt'
        }),
        ClientsModule.register([
          {
            name: 'NATS_CLIENT',
            transport: Transport.NATS,
            options: getNatsOptions(
              CommonConstants.AUTH_SERVICE,
              process.env.API_GATEWAY_NKEY_SEED,
              process.env.NATS_CREDS_FILE
            )
          },
          CommonModule
        ]),
        UserModule,
        PrismaServiceModule,
        ...importedModules
      ],
      controllers: controllerOverrides.length ? controllerOverrides : [AuthzController],
      providers: [
        JwtStrategy,
        AuthzService,
        MobileJwtStrategy,
        SocketGateway,
        NATSClient,
        VerificationService,
        ConnectionService,
        AgentService,
        CommonService,
        UserService,
        SupabaseService,
        OrganizationService,
        UserRepository,
        Logger,
        ...overrides
      ],
      exports: [PassportModule, AuthzService]
    };
  }
}
