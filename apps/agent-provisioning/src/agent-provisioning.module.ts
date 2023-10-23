import { Logger, Module } from '@nestjs/common';
import { AgentProvisioningController } from './agent-provisioning.controller';
import { AgentProvisioningService } from './agent-provisioning.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
// import { Authenticator, nkeyAuthenticator } from 'nats';
@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: {
          servers: [`${process.env.NATS_URL}`]
          // authenticator: nkeyAuthenticator(new TextEncoder().encode(process.env.AGENT_PROVISIONING_NKEY_SEED)),
        }
      }
    ])
  ],
  controllers: [AgentProvisioningController],
  providers: [AgentProvisioningService, Logger]
})
export class AgentProvisioningModule { }
